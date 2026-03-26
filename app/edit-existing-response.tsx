import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useClosedTemplateItems } from '../hooks/useClosedTemplateItems';
import { useOpenTemplateItems } from '../hooks/useOpenTemplateItems';
import { useClosedInspectionResponses } from '../hooks/useClosedInspectionResponses';
import { useOpenInspectionResponses } from '../hooks/useOpenInspectionResponses';
import { useClosedInspectionResponseItems } from '../hooks/useClosedInspectionResponseItems';
import { useOpenInspectionResponseItems } from '../hooks/useOpenInspectionResponseItems';
import { useImageUpload } from '../hooks/useImageUpload';
import { useInspectionTeam } from '../hooks/useInspectionTeam';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIsOffline } from '../utils/networkStore';
import { storage } from '../utils/storage';
import { copyImageToPersistentStorage } from '../utils/imageStorage';

/** True if the URL is a local path (file://, content://, or device path). Never send these to the API. */
const isLocalImageUri = (uri: string | null | undefined): boolean => {
  if (!uri || typeof uri !== 'string') return true;
  return uri.startsWith('file://') || uri.startsWith('content://') || (!uri.startsWith('http://') && !uri.startsWith('https://'));
};

const isNetworkFailure = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message : String(err || '');
  const lower = msg.toLowerCase();
  return (
    msg === 'Network request failed' ||
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error')
  );
};

interface TemplateItem {
  id: string;
  item_id?: string;
  question_index: string;
  text: string;
  category: string;
  question_type?: 'text' | 'single_choice' | 'multiple_choice';
  options?: string[];
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  address?: string;
}

interface ClosedResponseData {
  item_id: string;
  question_index: string;
  response: string; // Can be any option value, not just C/CP/NC/NA
  explanation?: string;
  image_url?: string | null;
  response_item_id?: string; // ID del item de respuesta existente
}

interface OpenResponseData {
  item_id: string;
  question_index: string;
  response: string;
  image_url?: string | null;
  response_item_id?: string; // ID del item de respuesta existente
}

interface TeamMember {
  id?: string;
  cargo: string;
  empresa: string;
  nombre: string;
  sort_order?: number;
}

export default function EditExistingResponseScreen() {
  const params = useLocalSearchParams();
  const responseId = params.responseId as string;
  const templateId = params.templateId as string;
  const type = params.type as 'closed' | 'open';
  const templateTitle = params.templateTitle as string || 'Template';


  const { getCurrentCompany, userCompanies, loadUserCompanies, isLoading: authIsLoading } = useAuth();
  const { getItemsByTemplateId } = type === 'closed' ? useClosedTemplateItems() : useOpenTemplateItems();
  const { getResponseById: getClosedResponseById, updateResponse: updateClosedResponse } = useClosedInspectionResponses();
  const { getResponseById: getOpenResponseById, updateResponse: updateOpenResponse } = useOpenInspectionResponses();
  const { 
    getItemsByResponseId: getClosedResponseItems, 
    createItem: createClosedResponseItem,
    updateItem: updateClosedResponseItem,
    deleteItem: deleteClosedResponseItem
  } = useClosedInspectionResponseItems();
  const { 
    getItemsByResponseId: getOpenResponseItems,
    createItem: createOpenResponseItem,
    updateItem: updateOpenResponseItem,
    deleteItem: deleteOpenResponseItem
  } = useOpenInspectionResponseItems();
  const { uploadImage, deleteImage, uploading: uploadingImage } = useImageUpload();
  const { createTeamMember, updateTeamMember, deleteTeamMember, getTeamMembersByResponseId } = useInspectionTeam();

  const handleDeleteImage = async (itemId: string) => {
    try {
      // Get current image URL from state - check both responseData and localImages
      const responseData = type === 'closed' 
        ? closedResponses[itemId] 
        : openResponses[itemId];
      const currentImageUrl = localImages[itemId] || responseData?.image_url;
      
      // Delete from S3 if image exists
      if (currentImageUrl) {
        try {
          await deleteImage(currentImageUrl);
        } catch (error) {
          console.error('Error deleting image from S3:', error);
          // Continue with state update even if S3 deletion fails
        }
      }
      
      // Update state to remove image - ensure the object exists before updating
      if (type === 'closed') {
        setClosedResponses(prev => {
          if (!prev[itemId]) {
            return prev; // Item doesn't exist, nothing to update
          }
          return {
            ...prev,
            [itemId]: { 
              ...prev[itemId], 
              image_url: null 
            }
          };
        });
      } else {
        setOpenResponses(prev => {
          if (!prev[itemId]) {
            return prev; // Item doesn't exist, nothing to update
          }
          return {
            ...prev,
            [itemId]: { 
              ...prev[itemId], 
              image_url: null 
            }
          };
        });
      }
      
      // Remove from localImages
      setLocalImages(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      
      // Note: We don't update originalResponseItems here because we want to keep
      // the original value so the save function can detect the change from original to null
    } catch (error) {
      console.error('Error in handleDeleteImage:', error);
      Alert.alert('Error', 'No se pudo eliminar la imagen');
    }
  };

  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companiesSyncing, setCompaniesSyncing] = useState(false);
  const [usingLocalData, setUsingLocalData] = useState(false);
  const [localImages, setLocalImages] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  // If companies list is transiently empty, reload once from context/API.
  useEffect(() => {
    let cancelled = false;
    const ensureCompanies = async () => {
      if ((userCompanies?.length ?? 0) > 0) return;
      setCompaniesSyncing(true);
      try {
        await loadUserCompanies();
      } catch {
        // Silent fallback
      } finally {
        if (!cancelled) setCompaniesSyncing(false);
      }
    };
    ensureCompanies();
    return () => {
      cancelled = true;
    };
  }, [loadUserCompanies, userCompanies?.length]);

  // Auto-select first company when available (unless existing response already set one).
  useEffect(() => {
    if (!selectedCompanyId && (userCompanies?.length ?? 0) > 0) {
      setSelectedCompanyId(userCompanies[0].id);
    }
  }, [selectedCompanyId, userCompanies]);

  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  
  // For closed inspections: responses are C, CP, NC, NA
  const [closedResponses, setClosedResponses] = useState<Record<string, ClosedResponseData>>({});
  // For open inspections: responses are text
  const [openResponses, setOpenResponses] = useState<Record<string, OpenResponseData>>({});
  
  const [responseTitle, setResponseTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [area, setArea] = useState('');
  const [turno, setTurno] = useState('');
  const [cantidadPersonal, setCantidadPersonal] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  // Store existing response items IDs to track which ones to delete
  const [existingResponseItems, setExistingResponseItems] = useState<Record<string, string>>({});
  
  // Store original response items data for comparison
  const [originalResponseItems, setOriginalResponseItems] = useState<Record<string, any>>({});
  
  // Estados para tabs y equipo
  const [activeTab, setActiveTab] = useState<'preguntas' | 'equipo'>('preguntas');

  // Opciones de ubicación (Línea 2, Línea 4, TBM) - mismas que en nueva respuesta
  const ubicacionOpciones = [
    'LÍNEA 2 - PATIO TALLER SANTA ANITA (PTSA)',
    'LÍNEA 2 - ESTACIÓN 27 (E27)',
    'LÍNEA 2 - ESTACIÓN 26 (E26)',
    'LÍNEA 2 - ESTACIÓN 25 (E25)',
    'LÍNEA 2 - ESTACIÓN 24 (E24)',
    'LÍNEA 2 - ESTACIÓN 23 (E23)',
    'LÍNEA 2 - ESTACIÓN 22 (E22)',
    'LÍNEA 2 - ESTACIÓN 21 (E21)',
    'LÍNEA 2 - ESTACIÓN 20 (E20)',
    'LÍNEA 2 - ESTACIÓN 19 (E19)',
    'LÍNEA 2 - ESTACIÓN 18 (E18)',
    'LÍNEA 2 - ESTACIÓN 17 (E17)',
    'LÍNEA 2 - ESTACIÓN 16 (E16)',
    'LÍNEA 2 - ESTACIÓN 15 (E15)',
    'LÍNEA 2 - ESTACIÓN 14 (E14)',
    'LÍNEA 2 - ESTACIÓN 13 (E13)',
    'LÍNEA 2 - ESTACIÓN 12 (E12)',
    'LÍNEA 2 - ESTACIÓN 11 (E11)',
    'LÍNEA 2 - ESTACIÓN 10 (E10)',
    'LÍNEA 2 - ESTACIÓN 9 (E09)',
    'LÍNEA 2 - ESTACIÓN 8 (E08)',
    'LÍNEA 2 - ESTACIÓN 7 (E07)',
    'LÍNEA 2 - ESTACIÓN 6 (E06)',
    'LÍNEA 2 - ESTACIÓN 5 (E05)',
    'LÍNEA 2 - ESTACIÓN 4 (E04)',
    'LÍNEA 2 - ESTACIÓN 3 (E03)',
    'LÍNEA 2 - ESTACIÓN 2 (E02)',
    'LÍNEA 2 - ESTACIÓN 1 (E01)',
    'LÍNEA 4 - PATIO TALLER BOCANEGRA (PTBN)',
    'LÍNEA 4 - ESTACIÓN 1 (E04-01)',
    'LÍNEA 4 - ESTACIÓN 2 (E04-02)',
    'LÍNEA 4 - ESTACIÓN 3 (E04-03)',
    'LÍNEA 4 - ESTACIÓN 4 (E04-04)',
    'LÍNEA 4 - ESTACIÓN 5 (E04-05)',
    'LÍNEA 4 - ESTACIÓN 6 (E04-06)',
    'LÍNEA 4 - ESTACIÓN 7 (E04-07)',
    'LÍNEA 4 - ESTACIÓN 8 (E04-08)',
    'TBM - LÍNEA 2 ESTACIÓN 1 (E01-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 2 (E02-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 3 (E03-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 4 (E04-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 5 (E05-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 6 (E06-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 7 (E07-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 8 (E08-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 9 (E09-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 10 (E10-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 11 (E11-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 12 (E12-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 13 (E13-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 14 (E14-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 15 (E15-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 16 (E16-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 17 (E17-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 18 (E18-TBM)',
    'TBM - LÍNEA 2 ESTACIÓN 19 (E19-TBM)',
    'TBM-RAMAL 4 ESTACIÓN 1 (E04-01-TBM)',
    'TBM-RAMAL 4 ESTACIÓN 2 (E04-02-TBM)',
    'TBM-RAMAL 4 ESTACIÓN 3 (E04-03-TBM)',
    'TBM-RAMAL 4 ESTACIÓN 4 (E04-04-TBM)',
    'TBM-RAMAL 4 ESTACIÓN 5 (E04-05-TBM)',
    'TBM-RAMAL 4 ESTACIÓN 6 (E04-06-TBM)',
    'TBM-RAMAL 4 ESTACIÓN 7 (E04-07-TBM)',
    'TBM-RAMAL 4 ESTACIÓN 8 (E04-08-TBM)',
  ];
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { cargo: '', empresa: '', nombre: '', sort_order: 0 }
  ]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  
  // Navigation and auto-save
  const navigation = useNavigation();
  const isSavingRef = useRef(false);
  const hasLoadedTeamMembers = useRef<string | null>(null);

  useEffect(() => {
    loadData();
  }, [responseId, templateId, type]);

  // Load team members after data is loaded (only once per responseId)
  useEffect(() => {
    if (responseId && (type === 'closed' || type === 'open') && !loading && hasLoadedTeamMembers.current !== responseId) {
      hasLoadedTeamMembers.current = responseId;
      loadTeamMembers();
    }
  }, [responseId, type, loading]);

  // Intercept navigation to ask for confirmation before leaving
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isSavingRef.current) {
        // Don't prevent navigation if we're already saving
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Always ask for confirmation before leaving
      Alert.alert(
        '¿Cancelar acción?',
        '¿Estás seguro que deseas cancelar esta acción?',
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => {}
          },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: async () => {
              // Save changes before leaving
              await handleSave(e.data.action);
            }
          }
        ]
      );
    });

    return unsubscribe;
  }, [navigation, closedResponses, openResponses, responseTitle, notes, area, turno, cantidadPersonal, selectedCompanyId, type, templateItems, existingResponseItems, originalResponseItems, localImages]);

  const loadData = async () => {
    try {
      setLoading(true);
      const loadedItems = await loadTemplateItems(); // This will initialize empty responses
      await loadResponse(loadedItems); // This will load response data and then call loadResponseItems
    } catch (error: any) {
      Alert.alert('Error', `Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadResponse = async (loadedTemplateItems?: any[]) => {
    if (!responseId) return;
    
    try {
      let response;
      if (type === 'closed') {
        response = await getClosedResponseById(responseId);
      } else {
        response = await getOpenResponseById(responseId);
      }

      if (response) {
        setResponseTitle(response.title || '');
        setNotes(response.notes || '');
        setArea(response.Area || '');
        if (type === 'open') {
          setTurno(response.Turno || '');
        } else if (type === 'closed') {
          setCantidadPersonal(response.Cantidad_de_Personal?.toString() || '');
        }
        
        // Set company from response
        if (response.company_id) {
          setSelectedCompanyId(response.company_id);
        }
        
        // Load response items after template items are loaded
        await loadResponseItems(loadedTemplateItems);
      }
    } catch (error: any) {
      console.error('Error loading response:', error);
      Alert.alert('Error', `No se pudo cargar la respuesta: ${error.message}`);
    }
  };

  const loadResponseItems = async (loadedTemplateItems?: any[]) => {
    const templateItemsList = loadedTemplateItems ?? templateItems;

    if (!responseId || !templateItemsList || templateItemsList.length === 0) {
      return;
    }
    
    try {
      let responseItems;
      if (type === 'closed') {
        responseItems = await getClosedResponseItems(responseId);
      } else {
        responseItems = await getOpenResponseItems(responseId);
      }

      // Create a map of response items by item_id (which references template item's id)
      // item_id in response_items stores the UUID (id) of the template item
      const itemsMap: Record<string, any> = {};
      const existingItemsMap: Record<string, string> = {}; // Maps template item id -> response item id
      const originalItemsMap: Record<string, any> = {}; // Store original data for comparison
      
      responseItems.forEach((item: any) => {
        // item_id in response_items is the UUID of the template item
        itemsMap[item.item_id] = item;
        existingItemsMap[item.item_id] = item.id; // Store the response item ID
        // Store original data for comparison
        // Handle image_url: preserve it if it exists and is not empty, otherwise use null
        let imageUrl = null;
        if (item.image_url) {
          const urlValue = item.image_url;
          if (typeof urlValue === 'string' && urlValue.trim() !== '') {
            imageUrl = urlValue;
          }
        }
        
        if (type === 'closed') {
          originalItemsMap[item.item_id] = {
            response: item.response,
            explanation: item.explanation || null,
            image_url: imageUrl
          };
        } else {
          originalItemsMap[item.item_id] = {
            response: item.response,
            image_url: imageUrl
          };
        }
      });
      
      setExistingResponseItems(existingItemsMap);
      setOriginalResponseItems(originalItemsMap);
      
      // Pre-fill responses with existing data
      if (type === 'closed') {
        const preFilledResponses: Record<string, ClosedResponseData> = {};
        templateItemsList.forEach((templateItem: any) => {
          // Use templateItem.id directly as item_id (since closed_template_items doesn't have item_id field)
          const templateItemId = templateItem.id;
          const existingItem = itemsMap[templateItemId];
          
          // Handle image_url: use the value if it exists and is not empty, otherwise use undefined
          let imageUrl = undefined;
          if (existingItem?.image_url) {
            const urlValue = existingItem.image_url;
            // Only assign if it's a non-empty string
            if (typeof urlValue === 'string' && urlValue.trim() !== '') {
              imageUrl = urlValue;
            }
          }
          
          preFilledResponses[templateItem.id] = {
            item_id: templateItemId,
            question_index: templateItem.question_index,
            response: existingItem?.response || '',
            explanation: existingItem?.explanation || '',
            image_url: imageUrl,
            response_item_id: existingItem?.id
          };
        });
        setClosedResponses(preFilledResponses);
      } else {
        const preFilledResponses: Record<string, OpenResponseData> = {};
        templateItemsList.forEach((templateItem: any) => {
          // Use templateItem.id directly as item_id
          const templateItemId = templateItem.id;
          const existingItem = itemsMap[templateItemId];
          
          // Handle image_url: use the value if it exists and is not empty, otherwise use null
          let imageUrl = null;
          if (existingItem?.image_url) {
            const urlValue = existingItem.image_url;
            // Only assign if it's a non-empty string
            if (typeof urlValue === 'string' && urlValue.trim() !== '') {
              imageUrl = urlValue;
            }
          }
          
          preFilledResponses[templateItem.id] = {
            item_id: templateItemId,
            question_index: templateItem.question_index,
            response: existingItem?.response || '',
            image_url: imageUrl,
            response_item_id: existingItem?.id
          };
        });
        setOpenResponses(preFilledResponses);
      }
    } catch (error: any) {
      console.error('[loadResponseItems] Error loading response items:', error);
      Alert.alert('Error', `No se pudieron cargar las respuestas guardadas: ${error.message}`);
    }
  };

  const loadTemplateItems = async () => {
    try {
      if (!templateId) {
        throw new Error('No se proporcionó el ID del template');
      }

      let items: any[] = [];
      if (usingLocalData) {
        items = type === 'closed'
          ? ((await storage.loadClosedTemplateItems(templateId)) || [])
          : ((await storage.loadOpenTemplateItems(templateId)) || []);
      } else {
        try {
          items = await getItemsByTemplateId(templateId);
        } catch (error: any) {
          if (!isNetworkFailure(error)) throw error;
          const cached = type === 'closed'
            ? ((await storage.loadClosedTemplateItems(templateId)) || [])
            : ((await storage.loadOpenTemplateItems(templateId)) || []);
          if (!cached || cached.length === 0) throw error;
          items = cached;
          setUsingLocalData(true);
        }
      }
      
      if (items && items.length > 0) {
        setTemplateItems(items);
        // Group items by category to set initial selected category
        const grouped = items.reduce((acc:any, item: any) => {
          const category = item.category || 'Sin categoría';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item);
          return acc;
        }, {} as Record<string, any[]>);
        
        const categories = Object.keys(grouped);
        if (categories.length > 0) {
          setSelectedCategory(categories[0]);
        }
        
        // Initialize response data structure (will be filled by loadResponseItems)
        // Use templateItem.id directly as item_id since closed_template_items doesn't have item_id field
        if (type === 'closed') {
          const initialResponses: Record<string, ClosedResponseData> = {};
          items.forEach((item: any) => {
            initialResponses[item.id] = {
              item_id: item.id, // Use id directly
              question_index: item.question_index,
              response: '',
              explanation: ''
            };
          });
          setClosedResponses(initialResponses);
        } else {
          const initialResponses: Record<string, OpenResponseData> = {};
          items.forEach((item: any) => {
            initialResponses[item.id] = {
              item_id: item.id, // Use id directly
              question_index: item.question_index,
              response: ''
            };
          });
          setOpenResponses(initialResponses);
        }
        
        // After template items are loaded, load response items to fill them
        // This will be called from loadResponse after response is loaded
        return items;
      }
      return [];
    } catch (error: any) {
      Alert.alert('Error', `No se pudieron cargar las preguntas: ${error?.message || 'Error de red'}`);
      return [];
    }
  };

  const handleClosedResponseChange = (itemId: string, response: string) => {
    setClosedResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        response
      }
    }));
  };

  const handleBulkClosedCategoryResponse = (responseType: string) => {
    if (type !== 'closed' || !selectedCategory) return;
    const categoryItems = templateItems.filter(
      (item) => (item.category || 'Sin categoría') === selectedCategory
    );
    if (categoryItems.length === 0) return;

    setClosedResponses((prev) => {
      const next = { ...prev };
      categoryItems.forEach((item) => {
        if (item.question_type === 'text') return;
        const allowedOptions =
          item.options && item.options.length > 0 ? item.options : ['C', 'CP', 'NC', 'NA'];
        if (!allowedOptions.includes(responseType)) return;
        const existing = next[item.id];
        next[item.id] = {
          item_id: existing?.item_id || item.id,
          question_index: existing?.question_index || item.question_index,
          response: responseType,
          explanation: existing?.explanation || '',
          image_url: existing?.image_url,
          response_item_id: existing?.response_item_id,
        };
      });
      return next;
    });
  };

  const handleClosedExplanationChange = (itemId: string, explanation: string) => {
    setClosedResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        explanation
      }
    }));
  };

  const handleOpenResponseChange = (itemId: string, response: string) => {
    setOpenResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        response
      }
    }));
  };

  // Funciones para manejar el equipo de inspección
  const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    setTeamMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, { 
      cargo: '', 
      empresa: '', 
      nombre: '', 
      sort_order: prev.length 
    }]);
  };

  const removeTeamMember = async (index: number) => {
    const member = teamMembers[index];
    if (member.id) {
      try {
        await deleteTeamMember(member.id);
      } catch (error) {
        // Silently continue if deletion fails
      }
    }
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  };

  const isTeamComplete = () => {
    // Al menos el primer miembro debe estar completo
    if (teamMembers.length < 1) return false;
    const firstMember = teamMembers[0];
    return firstMember.cargo.trim() !== '' && 
           firstMember.empresa.trim() !== '' && 
           firstMember.nombre.trim() !== '';
  };

  const loadTeamMembers = async () => {
    if (!responseId || (type !== 'closed' && type !== 'open')) return;
    if (responseId.startsWith('local-')) return; // No team en servidor para respuestas offline

    try {
      setLoadingTeam(true);
      const members = await getTeamMembersByResponseId(responseId);
      if (members && members.length > 0) {
        setTeamMembers(members);
      }
      // Don't reset state if no members found - user might have already started typing
    } catch (error) {
      // Silently continue if loading fails
    } finally {
      setLoadingTeam(false);
    }
  };

  const handlePickImage = async (itemId: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Se necesitan permisos para acceder a las fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        let imageUri = result.assets[0].uri;
        if (getIsOffline()) {
          imageUri = await copyImageToPersistentStorage(imageUri);
          setLocalImages(prev => ({ ...prev, [itemId]: imageUri }));
          const imageUrl = imageUri;
          if (type === 'closed') {
            setClosedResponses(prev => ({
              ...prev,
              [itemId]: { ...prev[itemId], image_url: imageUrl }
            }));
          } else {
            setOpenResponses(prev => ({
              ...prev,
              [itemId]: { ...prev[itemId], image_url: imageUrl }
            }));
          }
          return;
        }
        setLocalImages(prev => ({ ...prev, [itemId]: imageUri }));
        
        try {
          const currentImageUrl = type === 'closed' 
            ? closedResponses[itemId]?.image_url 
            : openResponses[itemId]?.image_url;
          if (currentImageUrl && (currentImageUrl.startsWith('http') || currentImageUrl.startsWith('https'))) {
            try {
              await deleteImage(currentImageUrl);
            } catch (deleteError: any) {
              console.warn('Error deleting old image (continuing with upload):', deleteError);
            }
          }
          
          const imageUrl = await uploadImage({
            imageUri,
            folder: 'inspection-images',
            subfolder: type,
            identifier: responseId,
            itemId: itemId,
          });
          
          if (imageUrl) {
            if (type === 'closed') {
              setClosedResponses(prev => ({
                ...prev,
                [itemId]: { ...prev[itemId], image_url: imageUrl }
              }));
            } else {
              setOpenResponses(prev => ({
                ...prev,
                [itemId]: { ...prev[itemId], image_url: imageUrl }
              }));
            }
            setLocalImages(prev => {
              const newState = { ...prev };
              delete newState[itemId];
              return newState;
            });
          }
        } catch (error: any) {
          Alert.alert('Error', `Error al subir la imagen: ${error.message}`);
          setLocalImages(prev => {
            const newState = { ...prev };
            delete newState[itemId];
            return newState;
          });
        }
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleTakePhoto = async (itemId: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Se necesitan permisos de cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        let imageUri = result.assets[0].uri;
        if (getIsOffline()) {
          imageUri = await copyImageToPersistentStorage(imageUri);
          setLocalImages(prev => ({ ...prev, [itemId]: imageUri }));
          const imageUrl = imageUri;
          if (type === 'closed') {
            setClosedResponses(prev => ({
              ...prev,
              [itemId]: { ...prev[itemId], image_url: imageUrl }
            }));
          } else {
            setOpenResponses(prev => ({
              ...prev,
              [itemId]: { ...prev[itemId], image_url: imageUrl }
            }));
          }
          return;
        }
        setLocalImages(prev => ({ ...prev, [itemId]: imageUri }));
        
        try {
          const currentImageUrl = type === 'closed' 
            ? closedResponses[itemId]?.image_url 
            : openResponses[itemId]?.image_url;
          if (currentImageUrl && (currentImageUrl.startsWith('http') || currentImageUrl.startsWith('https'))) {
            try {
              await deleteImage(currentImageUrl);
            } catch (deleteError: any) {
              console.warn('Error deleting old image (continuing with upload):', deleteError);
            }
          }
          
          const imageUrl = await uploadImage({
            imageUri,
            folder: 'inspection-images',
            subfolder: type,
            identifier: responseId,
            itemId: itemId,
          });
          
          if (imageUrl) {
            if (type === 'closed') {
              setClosedResponses(prev => ({
                ...prev,
                [itemId]: { ...prev[itemId], image_url: imageUrl }
              }));
            } else {
              setOpenResponses(prev => ({
                ...prev,
                [itemId]: { ...prev[itemId], image_url: imageUrl }
              }));
            }
            setLocalImages(prev => {
              const newState = { ...prev };
              delete newState[itemId];
              return newState;
            });
          }
        } catch (error: any) {
          Alert.alert('Error', `Error al subir la imagen: ${error.message}`);
          setLocalImages(prev => {
            const newState = { ...prev };
            delete newState[itemId];
            return newState;
          });
        }
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const handleSave = async (navigationAction?: any) => {
    if (!selectedCompanyId) {
      if (navigationAction) {
        navigation.dispatch(navigationAction);
      } else {
        Alert.alert('Error', 'Selecciona una empresa');
      }
      return;
    }

    if (!responseTitle.trim()) {
      if (navigationAction) {
        // If navigating, just allow it without saving
        navigation.dispatch(navigationAction);
      } else {
        Alert.alert('Ubicación requerida', 'Por favor ingresa una ubicación para guardar la respuesta.');
      }
      return;
    }

    try {
      isSavingRef.current = true;
      setSaving(true);

      // Update the response (include template_id for closed so sync POST has it)
      const responseData: any = {
        title: responseTitle.trim()
      };
      if (type === 'closed' && templateId) {
        responseData.template_id = templateId;
      }

      // Add Area field (common for both types)
      if (area.trim()) {
        responseData.Area = area.trim();
      } else {
        responseData.Area = null;
      }
      
      if (type === 'open') {
        if (notes.trim()) {
        responseData.notes = notes.trim();
        } else {
        responseData.notes = null;
        }
        if (turno.trim()) {
          responseData.Turno = turno.trim();
        } else {
          responseData.Turno = null;
        }
      } else       if (type === 'closed') {
        if (cantidadPersonal.trim()) {
          responseData.Cantidad_de_Personal = parseInt(cantidadPersonal.trim()) || null;
        } else {
          responseData.Cantidad_de_Personal = null;
        }
      }

      responseData.company_id = selectedCompanyId;

      // Solo cuando estamos ONLINE y la inspección ya está en el servidor: subir a S3 las fotos
      // que sigan en localImages (file://, /data/...) antes de guardar. Así el backend nunca
      // recibe URI local (evita "NoSuchKey" en el Excel). Si estamos offline o es inspección
      // local (responseId.startsWith('local-')), se guarda localmente con la URI; el sync
      // subirá las imágenes al tener internet (offlineSync).
      const uploadedImageUrls: Record<string, string> = {};
      if (!responseId.startsWith('local-') && !getIsOffline()) {
        for (const [itemIdKey, uri] of Object.entries(localImages)) {
          if (!uri || !isLocalImageUri(uri)) continue;
          try {
            const imageUrl = await uploadImage({
              imageUri: uri,
              folder: 'inspection-images',
              subfolder: type,
              identifier: responseId,
              itemId: itemIdKey,
            });
            if (imageUrl) {
              uploadedImageUrls[itemIdKey] = imageUrl;
              if (type === 'closed') {
                setClosedResponses(prev => prev[itemIdKey] ? { ...prev, [itemIdKey]: { ...prev[itemIdKey], image_url: imageUrl } } : prev);
              } else {
                setOpenResponses(prev => prev[itemIdKey] ? { ...prev, [itemIdKey]: { ...prev[itemIdKey], image_url: imageUrl } } : prev);
              }
            }
          } catch (err: any) {
            console.warn('[edit-existing-response] Error subiendo imagen antes de guardar:', itemIdKey, err?.message);
          }
        }
      }

      // Guardado offline: actualizar payload local y cola (sin API de ítems)
      if (responseId.startsWith('local-')) {
        const items: any[] = [];
        if (type === 'closed') {
          for (const templateItem of templateItems) {
            const rd = closedResponses[templateItem.id];
            if (!rd?.response?.trim()) continue;
            const imageUrl = localImages[rd.item_id || templateItem.id] ?? rd.image_url ?? null;
            items.push({
              item_id: rd.item_id || templateItem.id,
              question_index: rd.question_index,
              response: rd.response?.trim() || '',
              explanation: rd.explanation?.trim() || null,
              image_url: imageUrl
            });
          }
          await updateClosedResponse(responseId, responseData, { items });
        } else {
          for (const templateItem of templateItems) {
            const rd = openResponses[templateItem.id];
            if (!rd?.response?.trim()) continue;
            const imageUrl = localImages[rd.item_id || templateItem.id] ?? rd.image_url ?? null;
            items.push({
              item_id: rd.item_id || templateItem.id,
              question_index: rd.question_index,
              response: rd.response?.trim() || '',
              image_url: imageUrl
            });
          }
          await updateOpenResponse(responseId, responseData, { items });
        }
        setSaving(false);
        isSavingRef.current = false;
        if (navigationAction) {
          navigation.dispatch(navigationAction);
        } else {
          Alert.alert('Guardado', 'Cambios guardados localmente. Se sincronizarán al reconectar.');
        }
        return;
      }

      if (type === 'closed') {
        await updateClosedResponse(responseId, responseData);
      } else {
        await updateOpenResponse(responseId, responseData);
      }

      // Handle response items: update existing (only if changed), create new, delete removed
      let updatedCount = 0;
      let createdCount = 0;
      let deletedCount = 0;
      let skippedCount = 0;
      
      if (type === 'closed') {
        // Prepare state copies for updates
        const currentResponseItemIds = new Set<string>();
        const updatedClosedResponsesState: Record<string, ClosedResponseData> = { ...closedResponses };
        const updatedExistingResponseItemsState: Record<string, string> = { ...existingResponseItems };
        const updatedOriginalResponseItemsState: Record<string, any> = { ...originalResponseItems };

        // Process all template items - collect all marked questions
        for (const templateItem of templateItems) {
          const responseData = closedResponses[templateItem.id];
          if (!responseData) continue;
          
          // Validate response - check if it's not empty
          const trimmedResponse = responseData.response?.trim();
          if (!trimmedResponse || trimmedResponse === '') {
            // Skip items without valid response
            continue;
          }
          
          // If item has options, validate against them
          let hasValidResponse = true;
          if (templateItem.question_type === 'single_choice' || templateItem.question_type === 'multiple_choice') {
            if (templateItem.options && templateItem.options.length > 0) {
              // For multiple choice, response might be comma-separated
              if (templateItem.question_type === 'multiple_choice') {
                const selectedOptions = trimmedResponse.split(',').map(s => s.trim()).filter(s => s);
                hasValidResponse = selectedOptions.length > 0 && selectedOptions.every(opt => templateItem.options!.includes(opt));
              } else {
                hasValidResponse = templateItem.options.includes(trimmedResponse);
              }
            }
          }
          // For text type or default, any non-empty response is valid
          
          if (!hasValidResponse) {
            // Skip items with invalid response
            continue;
          }
          
          const itemIdKey = responseData.item_id || templateItem.id;
          const existingResponseItemId = responseData.response_item_id || updatedExistingResponseItemsState[itemIdKey];

          if (existingResponseItemId) {
            // Item exists in DB - check if it changed
            const originalItem = updatedOriginalResponseItemsState[itemIdKey] || originalResponseItems[itemIdKey];
            const currentExplanation = responseData.explanation?.trim();
            const originalExplanation = originalItem?.explanation || null;
            
            // Compare current data with original
            const responseChanged = originalItem?.response !== trimmedResponse;
            const explanationChanged = originalExplanation !== currentExplanation;
            // Use S3 URL only (never send file:// or device path to API)
            const stateImageUrl = closedResponses[templateItem.id]?.image_url;
            const rawImageUrl = uploadedImageUrls[itemIdKey] || localImages[itemIdKey] || stateImageUrl || (responseData.image_url !== undefined ? responseData.image_url : null);
            const currentImageUrl = rawImageUrl && !isLocalImageUri(rawImageUrl) ? rawImageUrl : null;
            const originalImageUrl = originalItem?.image_url ?? null;
            const imageUrlChanged = originalImageUrl !== currentImageUrl;

            if (responseChanged || explanationChanged || imageUrlChanged) {
              // Data changed - update it (solo URL de S3, nunca URI local)
              const updateData: any = {
                response: trimmedResponse,
                explanation: currentExplanation,
                image_url: currentImageUrl
              };
              
              // Ensure no undefined values
              Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                  updateData[key] = null;
                }
              });
              
              await updateClosedResponseItem(existingResponseItemId, updateData);
              updatedCount++;

              updatedClosedResponsesState[templateItem.id] = {
                ...responseData,
                item_id: itemIdKey,
                response: responseData.response,
                explanation: currentExplanation,
                image_url: currentImageUrl, // Use currentImageUrl which includes the uploaded image URL
                response_item_id: existingResponseItemId
              };
              updatedExistingResponseItemsState[itemIdKey] = existingResponseItemId;
              updatedOriginalResponseItemsState[itemIdKey] = {
                response: responseData.response,
                explanation: currentExplanation,
                image_url: currentImageUrl
              };
            } else {
              // No changes - skip update
              skippedCount++;
            }
            
            currentResponseItemIds.add(existingResponseItemId);
            // Ensure state copy keeps current item reference even if unchanged
            if (!responseChanged && !explanationChanged) {
              updatedClosedResponsesState[templateItem.id] = {
                ...responseData,
                explanation: currentExplanation,
                item_id: itemIdKey,
                response: trimmedResponse,
                image_url: responseData.image_url,
                response_item_id: existingResponseItemId
              };
              updatedExistingResponseItemsState[itemIdKey] = existingResponseItemId;
              if (!updatedOriginalResponseItemsState[itemIdKey]) {
                updatedOriginalResponseItemsState[itemIdKey] = {
                  response: trimmedResponse,
                  explanation: currentExplanation,
                  image_url: responseData.image_url ?? null
                };
              }
            }
          } else {
            // Item doesn't exist - create it (solo URL de S3, nunca URI local)
            const rawImageUrl = uploadedImageUrls[itemIdKey] || localImages[itemIdKey] || (responseData.image_url !== undefined ? responseData.image_url : null);
            const imageUrlToSave = rawImageUrl && !isLocalImageUri(rawImageUrl) ? rawImageUrl : null;

            const createData: any = {
              response_id: responseId,
              item_id: itemIdKey,
              question_index: responseData.question_index,
              response: trimmedResponse,
              explanation: responseData.explanation?.trim() || null,
              image_url: imageUrlToSave
            };
            
            // Ensure no undefined values
            Object.keys(createData).forEach(key => {
              if (createData[key] === undefined) {
                createData[key] = null;
              }
            });
            
            const created = await createClosedResponseItem(createData);
            currentResponseItemIds.add(created.id);
            createdCount++;

            updatedClosedResponsesState[templateItem.id] = {
              ...responseData,
              item_id: itemIdKey,
              response: trimmedResponse,
              image_url: imageUrlToSave, // Use imageUrlToSave instead of responseData.image_url
              response_item_id: created.id
            };
            updatedExistingResponseItemsState[itemIdKey] = created.id;
            updatedOriginalResponseItemsState[itemIdKey] = {
              response: trimmedResponse,
              explanation: responseData.explanation?.trim() || null,
              image_url: imageUrlToSave ?? null // Use imageUrlToSave to ensure we have the correct URL
            };
          }
        }
        
        // Delete items that were removed (exist in DB but not in current state)
        for (const [templateItemId, responseItemId] of Object.entries(existingResponseItems)) {
          if (!currentResponseItemIds.has(responseItemId)) {
            await deleteClosedResponseItem(responseItemId);
            deletedCount++;

            delete updatedExistingResponseItemsState[templateItemId];

            const stateKey = Object.keys(updatedClosedResponsesState).find(key => updatedClosedResponsesState[key]?.item_id === templateItemId);
            if (stateKey) {
              updatedClosedResponsesState[stateKey] = {
                ...updatedClosedResponsesState[stateKey],
                response_item_id: undefined,
                response: '',
                explanation: ''
              };
            }

            delete updatedOriginalResponseItemsState[templateItemId];
          }
        }

        setClosedResponses(updatedClosedResponsesState);
        setExistingResponseItems(updatedExistingResponseItemsState);
        setOriginalResponseItems(updatedOriginalResponseItemsState);
      } else {
        // Get all current response items IDs that will be kept
        const currentResponseItemIds = new Set<string>();
        const updatedOpenResponsesState: Record<string, OpenResponseData> = { ...openResponses };
        const updatedExistingResponseItemsState: Record<string, string> = { ...existingResponseItems };
        const updatedOriginalResponseItemsState: Record<string, any> = { ...originalResponseItems };

        // Process all template items - collect all marked questions
        for (const templateItem of templateItems) {
          const responseData = openResponses[templateItem.id];
          if (!responseData) continue;
          
          const trimmedResponse = responseData.response?.trim();
          const hasValidResponse = trimmedResponse && trimmedResponse.length > 0;
          
          if (!hasValidResponse) {
            // Skip items without valid response
            continue;
          }
          
          const itemIdKey = responseData.item_id || templateItem.id;
          const existingResponseItemId = responseData.response_item_id || updatedExistingResponseItemsState[itemIdKey];

          if (existingResponseItemId) {
            // Item exists in DB - check if it changed
            const originalItem = updatedOriginalResponseItemsState[itemIdKey] || originalResponseItems[itemIdKey];
            const responseChanged = originalItem?.response !== trimmedResponse;
            // Use S3 URL only (never send file:// or device path to API)
            const rawImageUrl = uploadedImageUrls[itemIdKey] || localImages[itemIdKey] || (responseData.image_url !== undefined ? responseData.image_url : null);
            const currentImageUrl = rawImageUrl && !isLocalImageUri(rawImageUrl) ? rawImageUrl : null;
            const originalImageUrl = originalItem?.image_url ?? null;
            const imageUrlChanged = originalImageUrl !== currentImageUrl;

            if (responseChanged || imageUrlChanged) {
              // Data changed - update it (solo URL de S3)
              const updateData: any = {
                response: trimmedResponse,
                image_url: currentImageUrl
              };
              
              // Ensure no undefined values
              Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                  updateData[key] = null;
                }
              });
              
              await updateOpenResponseItem(existingResponseItemId, updateData);
              updatedCount++;

              updatedOpenResponsesState[templateItem.id] = {
                ...responseData,
                response: trimmedResponse,
                item_id: itemIdKey,
                image_url: currentImageUrl !== null ? currentImageUrl : undefined,
                response_item_id: existingResponseItemId
              };
              updatedExistingResponseItemsState[itemIdKey] = existingResponseItemId;
              updatedOriginalResponseItemsState[itemIdKey] = {
                response: trimmedResponse,
                image_url: currentImageUrl
              };
            } else {
              // No changes - skip update
              skippedCount++;
            }
            
            currentResponseItemIds.add(existingResponseItemId);
            if (!responseChanged) {
              updatedOpenResponsesState[templateItem.id] = {
                ...responseData,
                response: trimmedResponse,
                item_id: itemIdKey,
                image_url: currentImageUrl || undefined,
                response_item_id: existingResponseItemId
              };
              updatedExistingResponseItemsState[itemIdKey] = existingResponseItemId;
              if (!updatedOriginalResponseItemsState[itemIdKey]) {
                updatedOriginalResponseItemsState[itemIdKey] = {
                  response: trimmedResponse,
                  image_url: currentImageUrl ?? null
                };
              }
            }
          } else {
            // Item doesn't exist - create it (solo URL de S3, nunca URI local)
            const itemIdKey = responseData.item_id ?? templateItem.id;
            const stateImageUrl = openResponses[templateItem.id]?.image_url;
            const rawImageUrl = uploadedImageUrls[itemIdKey] || localImages[itemIdKey] || stateImageUrl || (responseData.image_url ?? null);
            const imageUrlToSave = rawImageUrl && !isLocalImageUri(rawImageUrl) ? rawImageUrl : null;

            const createData: any = {
              response_id: responseId,
              item_id: itemIdKey,
              question_index: responseData.question_index,
              response: trimmedResponse,
              image_url: imageUrlToSave
            };
            
            // Ensure no undefined values
            Object.keys(createData).forEach(key => {
              if (createData[key] === undefined) {
                createData[key] = null;
              }
            });
            
            const created = await createOpenResponseItem(createData);
            currentResponseItemIds.add(created.id);
            createdCount++;

            updatedOpenResponsesState[templateItem.id] = {
              ...responseData,
              response: trimmedResponse,
              item_id: itemIdKey,
              image_url: imageUrlToSave || undefined,
              response_item_id: created.id
            };
            updatedExistingResponseItemsState[itemIdKey] = created.id;
            updatedOriginalResponseItemsState[itemIdKey] = {
              response: trimmedResponse,
              image_url: imageUrlToSave ?? null
            };
          }
        }
        
        // Delete items that were removed (exist in DB but not in current state)
        for (const [templateItemId, responseItemId] of Object.entries(existingResponseItems)) {
          if (!currentResponseItemIds.has(responseItemId)) {
            await deleteOpenResponseItem(responseItemId);
            deletedCount++;

            delete updatedExistingResponseItemsState[templateItemId];

            const stateKey = Object.keys(updatedOpenResponsesState).find(key => updatedOpenResponsesState[key]?.item_id === templateItemId);
            if (stateKey) {
              updatedOpenResponsesState[stateKey] = {
                ...updatedOpenResponsesState[stateKey],
                response_item_id: undefined,
                response: ''
              };
            }

            delete updatedOriginalResponseItemsState[templateItemId];
          }
        }

        setOpenResponses(updatedOpenResponsesState);
        setExistingResponseItems(updatedExistingResponseItemsState);
        setOriginalResponseItems(updatedOriginalResponseItemsState);
      }

      // Build success message
      const messageParts = [];
      if (updatedCount > 0) messageParts.push(`${updatedCount} actualizado(s)`);
      if (createdCount > 0) messageParts.push(`${createdCount} creado(s)`);
      if (deletedCount > 0) messageParts.push(`${deletedCount} eliminado(s)`);
      if (skippedCount > 0) messageParts.push(`${skippedCount} sin cambios`);
      
      const message = messageParts.length > 0 
        ? `Respuesta actualizada exitosamente. ${messageParts.join(', ')}.`
        : 'Respuesta actualizada exitosamente.';
      
      // Save/update inspection team members (for both open and closed inspections)
      if (type === 'closed' || type === 'open') {
        // First, get all existing team members from DB to identify which ones to delete
        let existingTeamMemberIds: string[] = [];
        try {
          const existingMembers = await getTeamMembersByResponseId(responseId);
          existingTeamMemberIds = existingMembers.map((m: TeamMember) => m.id).filter(Boolean) as string[];
        } catch (error) {
          // Silently continue if we can't load existing members
        }
        
        if (teamMembers.length > 0) {
          const updatedTeamMembers = [...teamMembers];
          const teamErrors: string[] = [];
          const savedMemberIds: string[] = [];
          
          for (let i = 0; i < updatedTeamMembers.length; i++) {
            const member = updatedTeamMembers[i];
            // Only save members that have all required fields
            const cargo = (member.cargo || '').trim();
            const empresa = (member.empresa || '').trim();
            const nombre = (member.nombre || '').trim();
            
            if (cargo && empresa && nombre) {
              try {
                if (member.id) {
                  // Update existing member
                  await updateTeamMember(member.id, {
                    cargo: cargo,
                    empresa: empresa,
                    nombre: nombre,
                    sort_order: member.sort_order || 0
                  });
                  savedMemberIds.push(member.id);
                } else {
                  // Create new member
                  const created = await createTeamMember({
                    response_id: responseId,
                    cargo: cargo,
                    empresa: empresa,
                    nombre: nombre,
                    sort_order: member.sort_order || 0
                  });
                  // Update member with ID from DB in the array copy
                  updatedTeamMembers[i] = { ...member, id: created.id };
                  savedMemberIds.push(created.id);
                }
              } catch (error: any) {
                const errorMsg = error?.message || error?.toString() || 'Error desconocido al guardar miembro del equipo';
                teamErrors.push(`Error al guardar ${cargo}: ${errorMsg}`);
                // Continue with other members even if one fails
              }
            }
          }
          
          // Delete team members that are no longer in the array
          const membersToDelete = existingTeamMemberIds.filter(id => !savedMemberIds.includes(id));
          if (membersToDelete.length > 0) {
            for (const memberId of membersToDelete) {
              try {
                await deleteTeamMember(memberId);
              } catch (error: any) {
                teamErrors.push(`Error al eliminar miembro del equipo: ${error?.message || 'Error desconocido'}`);
              }
            }
          }
          
          // Update state with members that now have IDs
          setTeamMembers(updatedTeamMembers);
          
          // If there were errors, show them to the user
          if (teamErrors.length > 0) {
            if (!navigationAction) {
              Alert.alert(
                'Advertencia', 
                `La respuesta se guardó, pero hubo problemas al guardar algunos miembros del equipo:\n\n${teamErrors.join('\n')}`
              );
            }
          }
        } else {
          // If no team members in state, delete all existing members
          if (existingTeamMemberIds.length > 0) {
            for (const memberId of existingTeamMemberIds) {
              try {
                await deleteTeamMember(memberId);
              } catch (error: any) {
                // Silently continue if deletion fails
              }
            }
          }
        }
      }

      if (!navigationAction) {
        // If called from "Listo" button, reload data to show latest changes including images
        try {
          const loadedItems = await loadTemplateItems();
          await loadResponseItems(loadedItems);
        } catch (error: any) {
          console.error('[handleSave] Error reloading data after save:', error);
        }
        return;
      } else {
        // Auto-save completed, allow navigation
        navigation.dispatch(navigationAction);
      }
    } catch (error: any) {
      console.error('Error saving response:', error);
      
      let errorMessage = 'No se pudo guardar la respuesta';
      
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.message && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (error.toString && error.toString() !== '[object Object]') {
          errorMessage = error.toString();
        }
      }
      
      if (!navigationAction) {
        Alert.alert('Error', errorMessage);
        // Throw error so the button's onPress can catch it and prevent navigation
        throw error;
      } else {
        // Even if save fails, allow navigation (for auto-save on back button)
        navigation.dispatch(navigationAction);
      }
      
      // Log full error details for debugging
      console.error('[handleSave] Full error details:', {
        error,
        errorType: typeof error,
        errorMessage: error?.message,
        errorStack: error?.stack
      });
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  };

  const groupedItems = templateItems.reduce((acc, item) => {
    const category = item.category || 'Sin categoría';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, TemplateItem[]>);

  const categories = Object.keys(groupedItems);
  const currentCategoryItems = selectedCategory ? groupedItems[selectedCategory] || [] : [];
  const bulkCategoryOptions = Array.from(
    new Set(
      currentCategoryItems
        .filter((item) => item.question_type !== 'text')
        .flatMap((item) => (item.options && item.options.length > 0 ? item.options : ['C', 'CP', 'NC', 'NA']))
    )
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              // Save changes before going back
              handleSave();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Cargando...</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando respuesta...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            // Always ask for confirmation before leaving
            Alert.alert(
              '¿Cancelar acción?',
              '¿Estás seguro que deseas cancelar esta acción?',
              [
                {
                  text: 'No',
                  style: 'cancel',
                  onPress: () => {}
                },
                {
                  text: 'Sí, cancelar',
                  style: 'destructive',
                  onPress: () => {
                    // Cancel without saving
                    router.back();
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Editar Respuesta</Text>
          <Text style={styles.headerSubtitle}>{templateTitle}</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkButton} 
          onPress={async () => {
            try {
              await handleSave();
              // Navigate to history after saving successfully
              router.push('/(tabs)/history');
            } catch (error) {
              // Error is already handled in handleSave, don't navigate
              console.error('Error saving before navigation:', error);
            }
          }}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {usingLocalData ? (
        <View style={styles.localDataBanner}>
          <Text style={styles.localDataBannerText}>Utilizando datos guardados localmente</Text>
        </View>
      ) : null}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'preguntas' && styles.activeTab]}
          onPress={() => setActiveTab('preguntas')}
        >
          <Text style={[styles.tabText, activeTab === 'preguntas' && styles.activeTabText]}>
            Preguntas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'equipo' && styles.activeTab]}
          onPress={() => setActiveTab('equipo')}
        >
          <Text style={[styles.tabText, activeTab === 'equipo' && styles.activeTabText]}>
            Equipo
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {activeTab === 'preguntas' && (
          <>
        {/* Empresa (selector) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Empresa</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCompanyDropdown(true)}
            >
              <Text style={[
                styles.dropdownButtonText,
                !selectedCompanyId && { color: '#9ca3af' }
              ]}>
                {selectedCompanyId
                  ? (userCompanies?.find((c: Company) => c.id === selectedCompanyId)?.name ?? 'Seleccionar empresa')
                  : 'Seleccionar empresa'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Area Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Área</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Ej: Producción, Almacén, Oficinas"
            value={area}
            onChangeText={setArea}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Turno Input (only for open inspections) */}
        {type === 'open' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Turno</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Ej: Mañana, Tarde, Noche"
              value={turno}
              onChangeText={setTurno}
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {/* Cantidad de Personal Input (only for closed inspections) */}
        {type === 'closed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cantidad de Personal</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Ej: 10, 25, 50"
              value={cantidadPersonal}
              onChangeText={setCantidadPersonal}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {/* Location Dropdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowLocationDropdown(true)}
            >
              <Text style={[
                styles.dropdownButtonText,
                !responseTitle && { color: '#9ca3af' }
              ]}>
                {responseTitle || 'Seleccionar ubicación'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Dropdown Modal */}
        <Modal
          visible={showLocationDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLocationDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowLocationDropdown(false)}
          >
            <View style={styles.dropdownModalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.dropdownModalHeader}>
                <Text style={styles.dropdownModalTitle}>Seleccionar Ubicación</Text>
                <TouchableOpacity
                  onPress={() => setShowLocationDropdown(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.dropdownModalScroll}>
                {ubicacionOpciones.map((ubicacion) => (
                  <TouchableOpacity
                    key={ubicacion}
                    style={[
                      styles.dropdownModalItem,
                      responseTitle === ubicacion && styles.dropdownModalItemSelected
                    ]}
                    onPress={() => {
                      setResponseTitle(ubicacion);
                      setShowLocationDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownModalItemText,
                      responseTitle === ubicacion && styles.dropdownModalItemTextSelected
                    ]}>
                      {ubicacion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Company Dropdown Modal */}
        <Modal
          visible={showCompanyDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCompanyDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCompanyDropdown(false)}
          >
            <View style={styles.dropdownModalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.dropdownModalHeader}>
                <Text style={styles.dropdownModalTitle}>Seleccionar Empresa</Text>
                <TouchableOpacity
                  onPress={() => setShowCompanyDropdown(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.dropdownModalScroll}>
                {(userCompanies || []).map((company: Company) => (
                  <TouchableOpacity
                    key={company.id}
                    style={[
                      styles.dropdownModalItem,
                      selectedCompanyId === company.id && styles.dropdownModalItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCompanyId(company.id);
                      setShowCompanyDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownModalItemText,
                      selectedCompanyId === company.id && styles.dropdownModalItemTextSelected
                    ]}>
                      {company.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {(userCompanies?.length ?? 0) === 0 && (
                  <Text style={styles.dropdownModalItemText}>
                    {(authIsLoading || companiesSyncing)
                      ? 'Cargando empresas...'
                      : 'No hay empresas disponibles en este momento. Intenta nuevamente.'}
                  </Text>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Category Selector */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoría</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCategoryDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedCategory || 'Seleccionar categoría'}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Category Dropdown Modal */}
        <Modal
          visible={showCategoryDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCategoryDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCategoryDropdown(false)}
          >
            <View style={styles.dropdownModalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.dropdownModalHeader}>
                <Text style={styles.dropdownModalTitle}>Seleccionar Categoría</Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryDropdown(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.dropdownModalScroll}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.dropdownModalItem,
                      selectedCategory === category && styles.dropdownModalItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownModalItemText,
                      selectedCategory === category && styles.dropdownModalItemTextSelected
                    ]}>
                      {category}
                    </Text>
                    <Text style={styles.dropdownModalItemCount}>
                      {groupedItems[category].length} pregunta{groupedItems[category].length !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Questions for Selected Category */}
        {selectedCategory && currentCategoryItems.length > 0 && (
          <View style={styles.section}>
            {type === 'closed' ? (
              <View style={styles.bulkActionsContainer}>
                <Text style={styles.bulkActionsLabel}>Marcar toda la categoría:</Text>
                <View style={styles.bulkButtonsRow}>
                  {bulkCategoryOptions.map((responseType) => (
                    <TouchableOpacity
                      key={responseType}
                      style={styles.bulkActionButton}
                      onPress={() => handleBulkClosedCategoryResponse(responseType)}
                    >
                      <Text style={styles.bulkActionButtonText}>{responseType}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
            {currentCategoryItems.map((item, index) => (
              <View key={item.id} style={styles.questionCard}>
                {/* Question Text */}
                <Text style={styles.questionText}>{item.text}</Text>

                {type === 'closed' ? (
                  <View style={styles.closedResponseContainer}>
                    {/* Response Options/Input - In the middle */}
                    {item.question_type === 'text' ? (
                      <View style={styles.textInputWithIconContainer}>
                        {(() => {
                          const responseData = closedResponses[item.id];
                          const hasImage = localImages[item.id] || (responseData?.image_url && typeof responseData.image_url === 'string' && responseData.image_url.trim() !== '');
                          return (
                            <TouchableOpacity
                              style={styles.imageIconButton}
                              onPress={() => {
                                Alert.alert(
                                  hasImage ? 'Cambiar imagen' : 'Agregar imagen',
                                  '¿Cómo deseas ' + (hasImage ? 'cambiar' : 'agregar') + ' la imagen?',
                                  [
                                    {
                                      text: 'Tomar foto',
                                      onPress: () => handleTakePhoto(item.id)
                                    },
                                    {
                                      text: 'Galería',
                                      onPress: () => handlePickImage(item.id)
                                    },
                                    ...(hasImage ? [{
                                      text: 'Eliminar',
                                      style: 'destructive' as const,
                                      onPress: () => handleDeleteImage(item.id)
                                    }] : []),
                                    {
                                      text: 'Cancelar',
                                      style: 'cancel' as const
                                    }
                                  ]
                                );
                              }}
                              disabled={uploadingImage}
                            >
                              {uploadingImage && localImages[item.id] ? (
                                <ActivityIndicator size="small" color="#3b82f6" />
                              ) : (
                                <Ionicons 
                                  name="image" 
                                  size={20} 
                                  color={hasImage ? "#3b82f6" : "#9ca3af"} 
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })()}
                        <TextInput
                          style={styles.textInputWithIcon}
                          placeholder="Escribe tu respuesta aquí..."
                          value={closedResponses[item.id]?.response || ''}
                          onChangeText={(text) => handleClosedResponseChange(item.id, text)}
                          multiline
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    ) : item.question_type === 'single_choice' || item.question_type === 'multiple_choice' ? (
                      <View style={styles.responseButtonsContainer}>
                        {(item.options && item.options.length > 0 ? item.options : ['C', 'CP', 'NC', 'NA']).map((option) => {
                          const currentResponse = closedResponses[item.id]?.response || '';
                          const isSelected = item.question_type === 'multiple_choice' 
                            ? currentResponse.split(',').map(s => s.trim()).includes(option)
                            : currentResponse === option;
                          return (
                            <TouchableOpacity
                              key={option}
                              style={[
                                styles.responseButton,
                                isSelected && styles.responseButtonSelected,
                                isSelected && { backgroundColor: '#6366f1' }
                              ]}
                              onPress={() => {
                                if (item.question_type === 'multiple_choice') {
                                  // Toggle option for multiple choice
                                  const current = currentResponse.split(',').map(s => s.trim()).filter(s => s);
                                  const newResponse = current.includes(option)
                                    ? current.filter(opt => opt !== option).join(', ')
                                    : [...current, option].join(', ');
                                  handleClosedResponseChange(item.id, newResponse);
                                } else {
                                  // Single choice - replace
                                  handleClosedResponseChange(item.id, option);
                                }
                              }}
                            >
                              <Text style={[
                                styles.responseButtonText,
                                isSelected && styles.responseButtonTextSelected
                              ]}>
                                {option}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      // Default: show C, CP, NC, NA for backward compatibility
                      <View style={styles.responseButtonsContainer}>
                        {(['C', 'CP', 'NC', 'NA'] as const).map((responseType) => {
                          const currentResponse = closedResponses[item.id]?.response || '';
                          const isSelected = currentResponse === responseType;
                          return (
                            <TouchableOpacity
                              key={responseType}
                              style={[
                                styles.responseButton,
                                isSelected && styles.responseButtonSelected,
                                responseType === 'C' && isSelected && { backgroundColor: '#10b981' },
                                responseType === 'CP' && isSelected && { backgroundColor: '#f59e0b' },
                                responseType === 'NC' && isSelected && { backgroundColor: '#ef4444' },
                                responseType === 'NA' && isSelected && { backgroundColor: '#6b7280' }
                              ]}
                              onPress={() => handleClosedResponseChange(item.id, responseType)}
                            >
                              <Text style={[
                                styles.responseButtonText,
                                isSelected && styles.responseButtonTextSelected
                              ]}>
                                {responseType}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    
                    {/* Explanation - After options (only if not text type) */}
                    {item.question_type !== 'text' && (
                      <View style={styles.explanationInputWithIconContainer}>
                        {(() => {
                          const responseData = closedResponses[item.id];
                          const hasImage = localImages[item.id] || (responseData?.image_url && typeof responseData.image_url === 'string' && responseData.image_url.trim() !== '');
                          return (
                            <TouchableOpacity
                              style={styles.imageIconButton}
                              onPress={() => {
                                Alert.alert(
                                  hasImage ? 'Cambiar imagen' : 'Agregar imagen',
                                  '¿Cómo deseas ' + (hasImage ? 'cambiar' : 'agregar') + ' la imagen?',
                                  [
                                    {
                                      text: 'Tomar foto',
                                      onPress: () => handleTakePhoto(item.id)
                                    },
                                    {
                                      text: 'Galería',
                                      onPress: () => handlePickImage(item.id)
                                    },
                                    ...(hasImage ? [{
                                      text: 'Eliminar',
                                      style: 'destructive' as const,
                                      onPress: () => handleDeleteImage(item.id)
                                    }] : []),
                                    {
                                      text: 'Cancelar',
                                      style: 'cancel' as const
                                    }
                                  ]
                                );
                              }}
                              disabled={uploadingImage}
                            >
                              {uploadingImage && localImages[item.id] ? (
                                <ActivityIndicator size="small" color="#3b82f6" />
                              ) : (
                                <Ionicons 
                                  name="image" 
                                  size={20} 
                                  color={hasImage ? "#3b82f6" : "#9ca3af"} 
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })()}
                        <TextInput
                          style={styles.explanationInputWithIcon}
                          placeholder="Explicación (opcional)"
                          value={closedResponses[item.id]?.explanation || ''}
                          onChangeText={(text) => handleClosedExplanationChange(item.id, text)}
                          multiline
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    )}
                  </View>
                ) : (
                  // Open inspections
                  <>
                    {/* Response Options/Input - In the middle */}
                    {item.question_type === 'single_choice' || item.question_type === 'multiple_choice' ? (
                      <View style={styles.responseButtonsContainer}>
                        {(item.options && item.options.length > 0 ? item.options : []).map((option) => {
                          const currentResponse = openResponses[item.id]?.response || '';
                          const isSelected = item.question_type === 'multiple_choice' 
                            ? currentResponse.split(',').map(s => s.trim()).includes(option)
                            : currentResponse === option;
                          return (
                            <TouchableOpacity
                              key={option}
                              style={[
                                styles.responseButton,
                                isSelected && styles.responseButtonSelected,
                                isSelected && { backgroundColor: '#6366f1' }
                              ]}
                              onPress={() => {
                                if (item.question_type === 'multiple_choice') {
                                  // Toggle option for multiple choice
                                  const current = currentResponse.split(',').map(s => s.trim()).filter(s => s);
                                  const newResponse = current.includes(option)
                                    ? current.filter(opt => opt !== option).join(', ')
                                    : [...current, option].join(', ');
                                  handleOpenResponseChange(item.id, newResponse);
                                } else {
                                  // Single choice - replace
                                  handleOpenResponseChange(item.id, option);
                                }
                              }}
                            >
                              <Text style={[
                                styles.responseButtonText,
                                isSelected && styles.responseButtonTextSelected
                              ]}>
                                {option}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.textInputWithIconContainer}>
                        {(() => {
                          const responseData = openResponses[item.id];
                          const hasImage = localImages[item.id] || (responseData?.image_url && typeof responseData.image_url === 'string' && responseData.image_url.trim() !== '');
                          return (
                            <TouchableOpacity
                              style={styles.imageIconButton}
                              onPress={() => {
                                Alert.alert(
                                  hasImage ? 'Cambiar imagen' : 'Agregar imagen',
                                  '¿Cómo deseas ' + (hasImage ? 'cambiar' : 'agregar') + ' la imagen?',
                                  [
                                    {
                                      text: 'Tomar foto',
                                      onPress: () => handleTakePhoto(item.id)
                                    },
                                    {
                                      text: 'Galería',
                                      onPress: () => handlePickImage(item.id)
                                    },
                                    ...(hasImage ? [{
                                      text: 'Eliminar',
                                      style: 'destructive' as const,
                                      onPress: () => handleDeleteImage(item.id)
                                    }] : []),
                                    {
                                      text: 'Cancelar',
                                      style: 'cancel' as const
                                    }
                                  ]
                                );
                              }}
                              disabled={uploadingImage}
                            >
                              {uploadingImage && localImages[item.id] ? (
                                <ActivityIndicator size="small" color="#3b82f6" />
                              ) : (
                                <Ionicons 
                                  name="image" 
                                  size={20} 
                                  color={hasImage ? "#3b82f6" : "#9ca3af"} 
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })()}
                        <TextInput
                          style={styles.textInputWithIcon}
                          placeholder="Escribe tu respuesta aquí..."
                          value={openResponses[item.id]?.response || ''}
                          onChangeText={(text) => handleOpenResponseChange(item.id, text)}
                          multiline
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Notes Section - Only for Open Inspections */}
        {type === 'open' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <TextInput
              style={[styles.titleInput, { minHeight: 100 }]}
              placeholder="Notas adicionales (opcional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
          </>
        )}

        {/* Equipo Section */}
        {activeTab === 'equipo' && (
          <View style={styles.equipoSection}>
            <Text style={styles.equipoTitle}>Equipo de Inspección</Text>
            <Text style={styles.equipoSubtitle}>
              Complete al menos un miembro del equipo que realizó la inspección
            </Text>

            {loadingTeam ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Cargando equipo...</Text>
              </View>
            ) : (
              <>
                {teamMembers.map((member, index) => (
                  <View key={index} style={styles.teamMemberCard}>
                    <View style={styles.teamMemberHeader}>
                      <Text style={styles.teamMemberIndex}>Miembro {index + 1}</Text>
                      {index >= 1 && (
                        <TouchableOpacity 
                          onPress={() => removeTeamMember(index)}
                          style={styles.removeMemberButton}
                        >
                          <Ionicons name="close-circle" size={24} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Cargo *</Text>
                      <TextInput
                        style={styles.teamInput}
                        placeholder="Ej: Supervisor de SST"
                        value={member.cargo}
                        onChangeText={(text) => handleTeamMemberChange(index, 'cargo', text)}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Empresa *</Text>
                      <TextInput
                        style={styles.teamInput}
                        placeholder="Ej: SecuApp S.A."
                        value={member.empresa}
                        onChangeText={(text) => handleTeamMemberChange(index, 'empresa', text)}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Nombre(s) y Apellidos *</Text>
                      <TextInput
                        style={styles.teamInput}
                        placeholder="Ej: Juan Pérez García"
                        value={member.nombre}
                        onChangeText={(text) => handleTeamMemberChange(index, 'nombre', text)}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                ))}

                <TouchableOpacity 
                  style={styles.addMemberButton}
                  onPress={addTeamMember}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#6366f1" />
                  <Text style={styles.addMemberButtonText}>Agregar otro miembro</Text>
                </TouchableOpacity>

                <View style={styles.bottomSpacing} />
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  checkButton: {
    marginLeft: 16,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    marginTop: 2,
  },
  localDataBanner: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  localDataBannerText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  dropdownModalScroll: {
    maxHeight: 400,
  },
  dropdownModalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownModalItemSelected: {
    backgroundColor: '#eff6ff',
  },
  dropdownModalItemText: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 4,
  },
  dropdownModalItemTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  dropdownModalItemCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  bulkActionsContainer: {
    marginBottom: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bulkActionsLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  bulkButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  bulkActionButtonText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '700',
  },
  questionCard: {
    marginBottom: 12,
  },
  questionText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 10,
  },
  closedResponseContainer: {
    marginTop: 8,
  },
  responseButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  responseButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseButtonSelected: {
    borderWidth: 2,
  },
  responseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  responseButtonTextSelected: {
    color: '#fff',
  },
  explanationInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#fff',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  explanationInputWithIcon: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    padding: 12,
    paddingLeft: 4,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  textInputWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 80,
  },
  imageIconButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 4,
  },
  textInputWithIcon: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    padding: 12,
    paddingLeft: 4,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  explanationInputWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 60,
  },
  openResponseInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    margin: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  // Equipo section styles
  equipoSection: {
    padding: 20,
  },
  equipoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  equipoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  teamMemberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  teamMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  teamMemberIndex: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  removeMemberButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  teamInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  addMemberButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  imageSection: {
    marginTop: 10,
    marginBottom: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
  imageActionButtons: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  imageActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageDeleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
});

