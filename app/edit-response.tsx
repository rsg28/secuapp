import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
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
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useClosedTemplateItems } from '../hooks/useClosedTemplateItems';
import { useOpenTemplateItems } from '../hooks/useOpenTemplateItems';
import { useClosedInspectionResponses } from '../hooks/useClosedInspectionResponses';
import { useOpenInspectionResponses } from '../hooks/useOpenInspectionResponses';
import { useClosedInspectionResponseItems } from '../hooks/useClosedInspectionResponseItems';
import { useOpenInspectionResponseItems } from '../hooks/useOpenInspectionResponseItems';
import { useCompanies } from '../hooks/useCompanies';
import { useImageUpload } from '../hooks/useImageUpload';
import { useInspectionTeam } from '../hooks/useInspectionTeam';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../components/CustomAlert';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

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
  image_url?: string;
}

interface OpenResponseData {
  item_id: string;
  question_index: string;
  response: string;
  image_url?: string;
}

interface TeamMember {
  id?: string;
  cargo: string;
  empresa: string;
  nombre: string;
  sort_order?: number;
}

export default function EditResponseScreen() {
  const params = useLocalSearchParams();
  const templateId = params.templateId as string;
  const type = params.type as 'closed' | 'open';
  const templateTitle = params.templateTitle as string || 'Template';


  const { getCurrentCompany } = useAuth();
  const { getItemsByTemplateId } = type === 'closed' ? useClosedTemplateItems() : useOpenTemplateItems();
  const { createResponse: createClosedResponse } = useClosedInspectionResponses();
  const { createResponse: createOpenResponse } = useOpenInspectionResponses();
  const { createItem: createClosedResponseItem } = useClosedInspectionResponseItems();
  const { createItem: createOpenResponseItem } = useOpenInspectionResponseItems();
  const { getAllCompanies } = useCompanies();
  const { uploadImage, deleteImage, uploading: uploadingImage } = useImageUpload();
  const { createTeamMember } = useInspectionTeam();

  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localImages, setLocalImages] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const navigation = useNavigation();
  const isSavingRef = useRef(false);
  
  // Custom alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<any[]>([]);
  
  // Completion alert state
  const [showCompletionAlert, setShowCompletionAlert] = useState(false);
  
  // Estados para tabs y equipo
  const [activeTab, setActiveTab] = useState<'preguntas' | 'equipo'>('preguntas');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { cargo: '', empresa: '', nombre: '', sort_order: 0 }
  ]);
  const [wasAllAnswered, setWasAllAnswered] = useState(false);
  const [responseAlreadySaved, setResponseAlreadySaved] = useState(false);
  const [savedResponseId, setSavedResponseId] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadCompanies();
    loadTemplateItems();
  }, [templateId, type]);

  // Track changes to detect unsaved data
  useEffect(() => {
    const hasClosedResponses = type === 'closed' && Object.values(closedResponses).some(r => r.response && r.response !== '');
    const hasOpenResponses = type === 'open' && Object.values(openResponses).some(r => r.response && r.response.trim() !== '');
    const hasTitle = responseTitle.trim() !== '';
    const hasNotes = type === 'open' && notes.trim() !== '';
    const hasArea = area.trim() !== '';
    const hasTurno = type === 'open' && turno.trim() !== '';
    const hasCantidadPersonal = type === 'closed' && cantidadPersonal.trim() !== '';
    
    setHasUnsavedChanges(hasClosedResponses || hasOpenResponses || hasTitle || hasNotes || hasArea || hasTurno || hasCantidadPersonal);
  }, [closedResponses, openResponses, responseTitle, notes, type]);

  // Check if all questions are answered
  const areAllQuestionsAnswered = useCallback(() => {
    if (templateItems.length === 0) return false;
    
    // Check if team is complete
    if (!isTeamComplete()) return false;
    
    if (type === 'closed') {
      return templateItems.every(item => {
        const response = closedResponses[item.id];
        if (!response || !response.response) return false;
        
        // If item has options, validate against them
        if (item.question_type === 'single_choice' || item.question_type === 'multiple_choice') {
          if (item.options && item.options.length > 0) {
            return item.options.includes(response.response);
          }
        }
        // Fallback to default options for backward compatibility
        return ['C', 'CP', 'NC', 'NA'].includes(response.response);
      });
    } else {
      return templateItems.every(item => {
        const response = openResponses[item.id];
        if (!response || !response.response) return false;
        
        // For text questions, just check if not empty
        if (item.question_type === 'text' || !item.question_type) {
          return response.response.trim() !== '';
        }
        
        // For choice questions, validate against options
        if (item.question_type === 'single_choice' || item.question_type === 'multiple_choice') {
          if (item.options && item.options.length > 0) {
            // For multiple choice, response might be comma-separated
            const selectedOptions = response.response.split(',').map(s => s.trim()).filter(s => s);
            return selectedOptions.length > 0 && selectedOptions.every(opt => item.options!.includes(opt));
          }
        }
        
        return response.response.trim() !== '';
      });
    }
  }, [templateItems, closedResponses, openResponses, type]);

  // Show custom alert helper
  const showAlert = useCallback((title: string, message: string, buttons: any[] = [{ text: 'OK' }]) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons);
    setAlertVisible(true);
  }, []);

  // Track completion state (but don't show alert automatically)
  useEffect(() => {
    const allAnswered = areAllQuestionsAnswered();
    setWasAllAnswered(allAnswered);
  }, [areAllQuestionsAnswered, templateItems.length]);

  const loadCompanies = async () => {
    try {
      const result = await getAllCompanies(1, 100);
      if (result && result.data && result.data.companies) {
        const companiesList = result.data.companies;
        setCompanies(companiesList);
        // Set first company as default if available
        if (companiesList.length > 0) {
          setSelectedCompany(companiesList[0]);
        }
      }
    } catch (error: any) {
      console.error('Error loading companies:', error);
      // Fallback to getCurrentCompany if available
      const currentCompany = getCurrentCompany();
      if (currentCompany) {
        setSelectedCompany(currentCompany);
      }
    }
  };

  const loadTemplateItems = async () => {
    try {
      setLoading(true);
      
      if (!templateId) {
        throw new Error('No se proporcionó el ID del template');
      }
      
      const items = await getItemsByTemplateId(templateId);
      
      if (items && items.length > 0) {
        setTemplateItems(items);
        
        // Group items by category to set initial selected category
        const grouped = items.reduce((acc: Record<string, TemplateItem[]>, item: any) => {
          const category = item.category || 'Sin categoría';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item);
          return acc;
        }, {} as Record<string, TemplateItem[]>);
        
        const categories = Object.keys(grouped);
        if (categories.length > 0) {
          setSelectedCategory(categories[0]);
        }
        
        // Initialize response data
        // Use item.id directly as item_id since closed_template_items doesn't have item_id field
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
      }
    } catch (error: any) {
      showAlert('Error', `No se pudieron cargar las preguntas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClosedResponseChange = (itemId: string, response: string) => {
    setClosedResponses(prev => {
      // Find the template item to get item_id and question_index
      const templateItem = templateItems.find(item => item.id === itemId);
      const existingData = prev[itemId];
      
      return {
        ...prev,
        [itemId]: {
          item_id: existingData?.item_id || templateItem?.id || itemId,
          question_index: existingData?.question_index || templateItem?.question_index || '',
          response: response,
          explanation: existingData?.explanation || '',
          image_url: existingData?.image_url
        }
      };
    });
  };

  const handleClosedExplanationChange = (itemId: string, explanation: string) => {
    setClosedResponses(prev => {
      // Find the template item to get item_id and question_index
      const templateItem = templateItems.find(item => item.id === itemId);
      const existingData = prev[itemId];
      
      return {
        ...prev,
        [itemId]: {
          item_id: existingData?.item_id || templateItem?.id || itemId,
          question_index: existingData?.question_index || templateItem?.question_index || '',
          response: existingData?.response || '',
          explanation: explanation,
          image_url: existingData?.image_url
        }
      };
    });
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

  const handlePickImage = async (itemId: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permisos requeridos', 'Se necesitan permisos para acceder a las fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setLocalImages(prev => ({ ...prev, [itemId]: imageUri }));
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      showAlert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleTakePhoto = async (itemId: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permisos requeridos', 'Se necesitan permisos de cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setLocalImages(prev => ({ ...prev, [itemId]: imageUri }));
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      showAlert('Error', 'No se pudo tomar la foto');
    }
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

  const removeTeamMember = (index: number) => {
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

  const handleAutoSave = useCallback(async (navigationAction?: any) => {
    if (!selectedCompany) {
      if (navigationAction) {
        navigation.dispatch(navigationAction);
      }
      return;
    }

    if (!responseTitle.trim()) {
      if (navigationAction) {
        navigation.dispatch(navigationAction);
      }
      return;
    }

    try {
      isSavingRef.current = true;
      setSaving(true);

      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      // Create the response first
      const responseData: any = {
        template_id: templateId,
        company_id: selectedCompany.id,
        title: responseTitle.trim()
      };

      // Add optional fields
      const today = new Date().toISOString().split('T')[0];
      responseData.inspection_date = `${today}T00:00:00.000Z`; // ISO8601 format
      
      // Add Area field (common for both types)
      if (area.trim()) {
        responseData.Area = area.trim();
      }
      
      if (type === 'open') {
        if (notes.trim()) {
          responseData.notes = notes.trim();
        }
        if (turno.trim()) {
          responseData.Turno = turno.trim();
        }
      } else if (type === 'closed') {
        if (cantidadPersonal.trim()) {
          responseData.Cantidad_de_Personal = parseInt(cantidadPersonal.trim()) || null;
        }
      }

      let createdResponse;
      if (type === 'closed') {
        createdResponse = await createClosedResponse(responseData);
      } else {
        createdResponse = await createOpenResponse(responseData);
      }

      const responseId = createdResponse.id;
      
      // Save responseId for later use (e.g., sending email)
      setSavedResponseId(responseId);

      // Save inspection team members (for both open and closed inspections)
      if ((type === 'closed' || type === 'open') && teamMembers.length > 0) {
        for (const member of teamMembers) {
          // Only save members that have all required fields
          const cargo = (member.cargo || '').trim();
          const empresa = (member.empresa || '').trim();
          const nombre = (member.nombre || '').trim();
          
          if (cargo && empresa && nombre) {
            try {
              await createTeamMember({
                response_id: responseId,
                cargo: cargo,
                empresa: empresa,
                nombre: nombre,
                sort_order: member.sort_order || 0
              });
            } catch (error: any) {
              // Continue with other members even if one fails
            }
          }
        }
      }

      // Upload images that are in localImages
      const imageUploads: Record<string, string> = {};
      for (const [itemId, imageUri] of Object.entries(localImages)) {
        try {
          // Get current image URL before replacing (if this is an update)
          const currentImageUrl = type === 'closed' 
            ? closedResponses[itemId]?.image_url 
            : openResponses[itemId]?.image_url;
          
          // Delete old image from S3 if it exists
          if (currentImageUrl) {
            try {
              await deleteImage(currentImageUrl);
            } catch (deleteError: any) {
              console.warn(`Error deleting old image for item ${itemId} (continuing with upload):`, deleteError);
              // Continue with upload even if deletion fails
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
            // Store with both string and original key to ensure we can find it later
            imageUploads[itemId] = imageUrl;
            imageUploads[itemId.toString()] = imageUrl;
            
            // Update the response data with the uploaded image URL
            if (type === 'closed') {
              setClosedResponses(prev => ({
                ...prev,
                [itemId]: {
                  ...prev[itemId],
                  image_url: imageUrl
                }
              }));
            } else {
              setOpenResponses(prev => ({
                ...prev,
                [itemId]: {
                  ...prev[itemId],
                  image_url: imageUrl
                }
              }));
            }
          }
        } catch (error: any) {
          console.error(`Error uploading image for item ${itemId}:`, error);
          // Continue with other items even if one image fails
        }
      }
      
      // Clear local images after upload
      setLocalImages({});

      // Create only response items that have valid responses
      const createdItems = [];
      
      if (type === 'closed') {
        // Process closed responses - iterate by templateItems to ensure all items are processed
        // Use templateItems as source of truth to ensure we don't miss any items
        for (const templateItem of templateItems) {
          const closedItem = closedResponses[templateItem.id];
          
          // Skip items without response
          if (!closedItem || !closedItem.response || closedItem.response.trim() === '') {
            continue;
          }
          
          // Validate response based on question type
          let isValidResponse = false;
          
          if (templateItem.question_type === 'single_choice' || templateItem.question_type === 'multiple_choice') {
            // For single/multiple choice, validate against options if they exist
            const options = templateItem.options && Array.isArray(templateItem.options) ? templateItem.options : [];
            if (options.length > 0) {
              // For multiple choice, check if response contains valid options (comma-separated)
              if (templateItem.question_type === 'multiple_choice') {
                const responses = closedItem.response.split(',').map(r => r.trim()).filter(r => r);
                isValidResponse = responses.every(r => options.includes(r));
              } else {
                // Single choice - exact match
                isValidResponse = options.includes(closedItem.response);
              }
            } else {
              // No options defined, accept any response
              isValidResponse = true;
            }
          } else if (templateItem.question_type === 'text') {
            // For text questions, accept any non-empty response
            isValidResponse = closedItem.response.trim().length > 0;
          } else {
            // Default/backward compatibility: validate against C, CP, NC, NA
            isValidResponse = ['C', 'CP', 'NC', 'NA'].includes(closedItem.response);
          }
          
          if (!isValidResponse) {
            console.warn('Skipping item with invalid response:', {
              itemId: templateItem.id,
              questionIndex: templateItem.question_index,
              response: closedItem.response,
              questionType: templateItem.question_type,
              options: templateItem.options
            });
            continue;
          }
          
          // Validate required fields - use templateItem as source of truth
          const itemId = closedItem.item_id || templateItem.id;
          const questionIndex = closedItem.question_index || templateItem.question_index;
          
          if (!itemId || !questionIndex) {
            console.warn('Skipping item with missing required fields:', {
              templateItemId: templateItem.id,
              closedItem: closedItem
            });
            continue;
          }
          
          // Ensure all values are explicitly set (no undefined)
          const responseItemData: any = {};
          responseItemData.response_id = responseId || null;
          responseItemData.item_id = itemId;
          responseItemData.question_index = questionIndex;
          responseItemData.response = closedItem.response.trim();
          responseItemData.explanation = closedItem.explanation?.trim() || null;
          // Prioritize imageUploads (from just-uploaded images) over state image_url
          responseItemData.image_url = imageUploads[templateItem.id] || imageUploads[itemId] || closedItem.image_url || null;
          
          // Final validation - ensure no undefined values
          if (Object.values(responseItemData).some(v => v === undefined)) {
            console.error('[handleSave] Found undefined in responseItemData:', responseItemData);
            throw new Error(`Valores undefined encontrados en item: ${questionIndex}`);
          }
          
          if (!responseItemData.response_id || !responseItemData.item_id || 
              !responseItemData.question_index || !responseItemData.response) {
            console.warn('Skipping item with invalid data:', responseItemData);
            continue;
          }
          
          try {
            const createdItem = await createClosedResponseItem(responseItemData);
            createdItems.push(createdItem);
            console.log(`Successfully created response item for question ${questionIndex}:`, createdItem.id);
          } catch (error: any) {
            console.error('Error creating closed response item:', error);
            console.error('Item data that failed:', responseItemData);
            throw new Error(`Error al crear respuesta para pregunta ${questionIndex}: ${error.message}`);
          }
        }
      } else {
        // Process open responses - only create items with valid responses
        for (const itemData of Object.values(openResponses)) {
          const openItem = itemData as OpenResponseData;
          
          // Skip items without response or empty response
          const trimmedResponse = openItem.response?.trim();
          if (!trimmedResponse || trimmedResponse.length === 0) {
            continue;
          }
          
          // Validate required fields
          if (!openItem.item_id || !openItem.question_index) {
            console.warn('Skipping item with missing required fields:', openItem);
            continue;
          }
          
          // Ensure all values are explicitly set (no undefined)
          const responseItemData: any = {};
          responseItemData.response_id = responseId || null;
          responseItemData.item_id = openItem.item_id || null;
          responseItemData.question_index = openItem.question_index || null;
          responseItemData.response = trimmedResponse || null;
          
          // Prioritize imageUploads (from just-uploaded images) over state image_url
          // Try multiple key formats to ensure we find the image URL
          const imageUrlFromUploads = imageUploads[openItem.item_id] || 
                                     imageUploads[openItem.item_id?.toString()] ||
                                     (openItem.image_url && openItem.image_url !== 'undefined' ? openItem.image_url : null);
          
          responseItemData.image_url = imageUrlFromUploads;
          
          // Final validation - ensure no undefined values
          if (Object.values(responseItemData).some(v => v === undefined)) {
            console.error('[handleSave] Found undefined in responseItemData:', responseItemData);
            throw new Error(`Valores undefined encontrados en item: ${openItem.question_index}`);
          }
          
          if (!responseItemData.response_id || !responseItemData.item_id || 
              !responseItemData.question_index || !responseItemData.response) {
            console.warn('Skipping item with invalid data:', responseItemData);
            continue;
          }
          
          try {
            const createdItem = await createOpenResponseItem(responseItemData);
            createdItems.push(createdItem);
          } catch (error: any) {
            console.error('Error creating open response item:', error);
            throw new Error(`Error al crear respuesta para pregunta ${openItem.question_index}: ${error.message}`);
          }
        }
      }

      // Mark response as saved
      setResponseAlreadySaved(true);
      setHasUnsavedChanges(false);

      // Show success message only if not auto-saving
      if (!navigationAction) {
        // Check if all questions were answered
        if (createdItems.length > 0 && areAllQuestionsAnswered()) {
          // Show completion alert with send/download options
          setShowCompletionAlert(true);
        } else {
          showAlert(
            'Respuesta Creada',
            'La respuesta fue creada exitosamente. Puedes revisarla en el tab de Historial.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate to correct page based on type
                  if (type === 'open') {
                    router.push('/open-inspections');
                  } else {
                    router.push('/closed-inspections');
                  }
                }
              }
            ]
          );
        }
      } else {
        // Auto-save completed, allow navigation
        navigation.dispatch(navigationAction);
      }
    } catch (error: any) {
      console.error('Error saving response:', error);
      
      // Extract error message properly
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
        showAlert('Error', errorMessage);
      } else {
        // Even if save fails, allow navigation
        navigation.dispatch(navigationAction);
      }
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  }, [selectedCompany, responseTitle, type, notes, area, turno, cantidadPersonal, closedResponses, openResponses, templateId, createClosedResponse, createOpenResponse, createClosedResponseItem, createOpenResponseItem, navigation, showAlert, areAllQuestionsAnswered]);

  const handleSave = async () => {
    await handleAutoSave();
  };

  const handleDownload = async () => {
    try {
      if (!savedResponseId) {
        showAlert('Error', 'La respuesta aún no ha sido guardada. Por favor guarda primero.');
        return;
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación. Inicia sesión nuevamente.');
      }

      // Descargar directamente usando FileSystem (React Native compatible)
      const sanitizedTitle = (responseTitle || 'sin-titulo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `inspeccion-${sanitizedTitle}-${Date.now()}.xlsx`;
      
      // @ts-ignore - documentDirectory exists in expo-file-system
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Descargar directamente usando FileSystem
      const downloadResult = await FileSystem.downloadAsync(
        `${API_BASE_URL}/inspection-responses/download?responseId=${savedResponseId}&type=${type}`,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Verificar que la descarga fue exitosa
      if (downloadResult.status !== 200) {
        throw new Error(`Error al descargar el archivo: ${downloadResult.status}`);
      }
      
      // Compartir archivo
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Descargar Inspección',
        });
        showAlert('Éxito', 'Archivo Excel generado y listo para compartir');
        
        // Navigate to correct page based on type
        if (type === 'open') {
          router.push('/open-inspections');
        } else {
          router.push('/closed-inspections');
        }
      } else {
        showAlert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
    } catch (error: any) {
      showAlert('Error', `No se pudo generar el archivo: ${error.message}`);
    }
  };

  const handleCompletionAction = (action: 'send' | 'download') => {
    setShowCompletionAlert(false);
    if (action === 'send') {
      // Open send modal
      setShowSendModal(true);
      setSendEmail('');
    } else if (action === 'download') {
      handleDownload();
    }
  };

  const handleSend = async () => {
    if (!savedResponseId) {
      Alert.alert('Error', 'No se encontró la respuesta guardada');
      return;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!sendEmail.trim()) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico');
      return;
    }
    
    if (!emailRegex.test(sendEmail.trim())) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    try {
      setSending(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación. Inicia sesión nuevamente.');
      }

      const response = await fetch(`${API_BASE_URL}/inspection-responses/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          responseId: savedResponseId,
          type,
          email: sendEmail.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo procesar el envío');
      }

      Alert.alert('Éxito', `El archivo se ha enviado a ${sendEmail.trim()}`);
      setShowSendModal(false);
      setSendEmail('');
      
      // Navigate to correct page based on type
      if (type === 'open') {
        router.push('/open-inspections');
      } else {
        router.push('/closed-inspections');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo enviar el archivo por correo');
    } finally {
      setSending(false);
    }
  };

  // Intercept navigation to ask for confirmation before leaving
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isSavingRef.current) {
        // Don't prevent navigation if we're already saving
        return;
      }

      // If response was already saved, allow navigation without prompting
      if (responseAlreadySaved) {
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Always ask for confirmation before leaving
      showAlert(
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
              // If title exists, save before leaving
              if (responseTitle.trim() && selectedCompany) {
                await handleAutoSave(e.data.action);
              } else {
                // Just leave without saving
                navigation.dispatch(e.data.action);
              }
            }
          }
        ]
      );
    });

    return unsubscribe;
  }, [navigation, responseTitle, selectedCompany, handleAutoSave, responseAlreadySaved, showAlert]);

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Cargando...</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            // Ask for confirmation before leaving
            if (responseAlreadySaved) {
              router.back();
              return;
            }
            showAlert(
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
                    // Cancel without saving - just go back
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
          <Text style={styles.headerTitle}>Nueva Respuesta</Text>
          <Text style={styles.headerSubtitle}>{templateTitle}</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkButton} 
          onPress={async () => {
            // Same behavior as navigating back - auto-save if title exists
            if (!responseTitle.trim()) {
              showAlert(
                'Título requerido',
                'Por favor ingresa un título para guardar la respuesta.',
                [{ text: 'OK', onPress: () => {} }]
              );
              return;
            }
            await handleAutoSave();
          }}
          disabled={saving}
        >
          <Ionicons name="checkmark" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

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
        {/* Company Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Empresa</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCompanyDropdown(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedCompany ? selectedCompany.name : 'Seleccionar empresa'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
        </View>

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
                {companies.map((company) => (
                  <TouchableOpacity
                    key={company.id}
                    style={[
                      styles.dropdownModalItem,
                      selectedCompany?.id === company.id && styles.dropdownModalItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCompany(company);
                      setShowCompanyDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownModalItemText,
                      selectedCompany?.id === company.id && styles.dropdownModalItemTextSelected
                    ]}>
                      {company.name}
                    </Text>
                    {company.industry && (
                      <Text style={styles.dropdownModalItemCount}>
                        {company.industry}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

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

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Ej: dentro del peru, Lima"
            value={responseTitle}
            onChangeText={setResponseTitle}
            placeholderTextColor="#9ca3af"
          />
        </View>

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
            {currentCategoryItems.map((item, index) => (
              <View key={item.id} style={styles.questionCard}>
                {/* Question Text */}
                <Text style={styles.questionText}>{item.text}</Text>

                {type === 'closed' ? (
                  <View style={styles.closedResponseContainer}>
                    {/* Render based on question type */}
                    {item.question_type === 'text' ? (
                      <TextInput
                        style={styles.openResponseInput}
                        placeholder="Escribe tu respuesta aquí..."
                        value={closedResponses[item.id]?.response || ''}
                        onChangeText={(text) => handleClosedResponseChange(item.id, text)}
                        multiline
                        placeholderTextColor="#9ca3af"
                      />
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
                    <TextInput
                      style={styles.explanationInput}
                      placeholder="Explicación (opcional)"
                      value={closedResponses[item.id]?.explanation || ''}
                      onChangeText={(text) => handleClosedExplanationChange(item.id, text)}
                      multiline
                      placeholderTextColor="#9ca3af"
                    />
                    
                    {/* Image Section */}
                    <View style={styles.imageSection}>
                      {(() => {
                        const responseData = closedResponses[item.id];
                        const imageUrl = responseData?.image_url || localImages[item.id];
                        return (
                          <View style={styles.imageContainer}>
                            {imageUrl ? (
                              <Image 
                                source={{ uri: imageUrl }} 
                                style={styles.previewImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.imagePlaceholder}>
                                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                                <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
                              </View>
                            )}
                            <View style={styles.imageActionButtons}>
                              {imageUrl ? (
                                <>
                                  <TouchableOpacity 
                                    style={styles.imageActionButton}
                                    onPress={() => handleTakePhoto(item.id)}
                                    disabled={uploadingImage}
                                  >
                                    {uploadingImage && localImages[item.id] ? (
                                      <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                      <Ionicons name="camera" size={18} color="#fff" />
                                    )}
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    style={styles.imageActionButton}
                                    onPress={() => handlePickImage(item.id)}
                                    disabled={uploadingImage}
                                  >
                                    {uploadingImage && localImages[item.id] ? (
                                      <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                      <Ionicons name="image" size={18} color="#fff" />
                                    )}
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    style={[styles.imageActionButton, styles.imageDeleteButton]}
                                    onPress={() => {
                                      setClosedResponses(prev => ({
                                        ...prev,
                                        [item.id]: { ...prev[item.id], image_url: undefined }
                                      }));
                                      setLocalImages(prev => {
                                        const newState = { ...prev };
                                        delete newState[item.id];
                                        return newState;
                                      });
                                    }}
                                  >
                                    <Ionicons name="trash" size={18} color="#fff" />
                                  </TouchableOpacity>
                                </>
                              ) : (
                                <>
                                  <TouchableOpacity 
                                    style={styles.imageActionButton}
                                    onPress={() => handleTakePhoto(item.id)}
                                    disabled={uploadingImage}
                                  >
                                    {uploadingImage && localImages[item.id] ? (
                                      <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                      <Ionicons name="camera" size={18} color="#fff" />
                                    )}
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    style={styles.imageActionButton}
                                    onPress={() => handlePickImage(item.id)}
                                    disabled={uploadingImage}
                                  >
                                    {uploadingImage && localImages[item.id] ? (
                                      <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                      <Ionicons name="image" size={18} color="#fff" />
                                    )}
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          </View>
                        );
                      })()}
                    </View>
                  </View>
                ) : (
                  // Open inspections
                  <>
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
                      <TextInput
                        style={styles.openResponseInput}
                        placeholder="Escribe tu respuesta aquí..."
                        value={openResponses[item.id]?.response || ''}
                        onChangeText={(text) => handleOpenResponseChange(item.id, text)}
                        multiline
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                    
                {/* Image Section for Open Inspections */}
                <View style={styles.imageSection}>
                  {(() => {
                    const responseData = openResponses[item.id];
                    const imageUrl = responseData?.image_url || localImages[item.id];
                    return (
                      <View style={styles.imageContainer}>
                        {imageUrl ? (
                          <Image 
                            source={{ uri: imageUrl }} 
                            style={styles.previewImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <Ionicons name="image-outline" size={40} color="#9ca3af" />
                            <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
                          </View>
                        )}
                        <View style={styles.imageActionButtons}>
                          {imageUrl ? (
                            <>
                              <TouchableOpacity 
                                style={styles.imageActionButton}
                                onPress={() => handleTakePhoto(item.id)}
                                disabled={uploadingImage}
                              >
                                {uploadingImage && localImages[item.id] ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <Ionicons name="camera" size={18} color="#fff" />
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.imageActionButton}
                                onPress={() => handlePickImage(item.id)}
                                disabled={uploadingImage}
                              >
                                {uploadingImage && localImages[item.id] ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <Ionicons name="image" size={18} color="#fff" />
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.imageActionButton, styles.imageDeleteButton]}
                                onPress={() => {
                                  setOpenResponses(prev => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], image_url: undefined }
                                  }));
                                  setLocalImages(prev => {
                                    const newState = { ...prev };
                                    delete newState[item.id];
                                    return newState;
                                  });
                                }}
                              >
                                <Ionicons name="trash" size={18} color="#fff" />
                              </TouchableOpacity>
                            </>
                          ) : (
                            <>
                              <TouchableOpacity 
                                style={styles.imageActionButton}
                                onPress={() => handleTakePhoto(item.id)}
                                disabled={uploadingImage}
                              >
                                {uploadingImage && localImages[item.id] ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <Ionicons name="camera" size={18} color="#fff" />
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.imageActionButton}
                                onPress={() => handlePickImage(item.id)}
                                disabled={uploadingImage}
                              >
                                {uploadingImage && localImages[item.id] ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <Ionicons name="image" size={18} color="#fff" />
                                )}
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })()}
                </View>
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

        {/* Save Button - Only show if all questions are answered */}
        {areAllQuestionsAnswered() && (
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.saveButtonText}>
              {saving ? 'Guardando...' : 'Guardar Respuesta'}
            </Text>
          </TouchableOpacity>
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
          </View>
        )}
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={() => setAlertVisible(false)}
      />

      {/* Completion Alert - Send/Download */}
      <Modal
        visible={showCompletionAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompletionAlert(false)}
      >
        <View style={styles.completionAlertOverlay}>
          <View style={styles.completionAlertContainer}>
            <View style={styles.completionHeader}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              <Text style={styles.completionTitle}>¡Inspección Completada!</Text>
              <Text style={styles.completionMessage}>
                Has completado todas las preguntas. ¿Qué deseas hacer ahora?
              </Text>
            </View>
            <View style={styles.completionButtons}>
              <TouchableOpacity
                style={[styles.completionButton, styles.sendButton]}
                onPress={() => handleCompletionAction('send')}
              >
                <Ionicons name="send" size={24} color="#fff" />
                <Text style={styles.completionButtonText}>Enviar Inspección</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.completionButton, styles.downloadButton]}
                onPress={() => handleCompletionAction('download')}
              >
                <Ionicons name="download" size={24} color="#fff" />
                <Text style={styles.completionButtonText}>Descargar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.completionButton, styles.laterButton]}
                onPress={() => {
                  setShowCompletionAlert(false);
                  // Navigate to correct page based on type
                  if (type === 'open') {
                    router.push('/open-inspections');
                  } else {
                    router.push('/closed-inspections');
                  }
                }}
              >
                <Ionicons name="time-outline" size={24} color="#6b7280" />
                <Text style={styles.laterButtonText}>Continuar más tarde</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Send Email Modal */}
      <Modal
        visible={showSendModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSendModal(false)}
      >
        <View style={styles.sendModalOverlay}>
          <View style={styles.sendModalContent}>
            <View style={styles.sendModalHeader}>
              <Ionicons name="mail" size={32} color="#3b82f6" />
              <Text style={styles.sendModalTitle}>Enviar Inspección</Text>
            </View>
            <View style={styles.sendModalBody}>
              <Text style={styles.sendModalLabel}>Correo electrónico</Text>
              <TextInput
                style={styles.sendModalInput}
                placeholder="ejemplo@correo.com"
                value={sendEmail}
                onChangeText={setSendEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.sendModalInfo}>
                Se enviará un archivo CSV con los detalles de la inspección al correo especificado.
              </Text>
            </View>
            <View style={styles.sendModalActions}>
              <TouchableOpacity
                style={styles.sendModalCancelButton}
                onPress={() => {
                  setShowSendModal(false);
                  setSendEmail('');
                }}
              >
                <Text style={styles.sendModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendModalSendButton, sending && styles.sendModalSendButtonDisabled]}
                onPress={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.sendModalSendText}>Enviar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  completionAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionAlertContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  completionHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  completionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
  },
  completionMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  completionButtons: {
    padding: 20,
  },
  completionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
  },
  downloadButton: {
    backgroundColor: '#10b981',
  },
  completionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  laterButton: {
    backgroundColor: '#f3f4f6',
    marginTop: 0,
    marginBottom: 0,
  },
  laterButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
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
  sendModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sendModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sendModalHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sendModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
  },
  sendModalBody: {
    padding: 24,
  },
  sendModalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sendModalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  sendModalInfo: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  sendModalActions: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  sendModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  sendModalSendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    gap: 8,
  },
  sendModalSendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendModalSendText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

