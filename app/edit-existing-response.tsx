import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useClosedTemplateItems } from '../hooks/useClosedTemplateItems';
import { useOpenTemplateItems } from '../hooks/useOpenTemplateItems';
import { useClosedInspectionResponses } from '../hooks/useClosedInspectionResponses';
import { useOpenInspectionResponses } from '../hooks/useOpenInspectionResponses';
import { useClosedInspectionResponseItems } from '../hooks/useClosedInspectionResponseItems';
import { useOpenInspectionResponseItems } from '../hooks/useOpenInspectionResponseItems';
import { useCompanies } from '../hooks/useCompanies';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TemplateItem {
  id: string;
  item_id?: string;
  question_index: string;
  text: string;
  category: string;
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
  response: 'C' | 'CP' | 'NC' | 'NA' | '';
  explanation?: string;
  response_item_id?: string; // ID del item de respuesta existente
}

interface OpenResponseData {
  item_id: string;
  question_index: string;
  response: string;
  response_item_id?: string; // ID del item de respuesta existente
}

export default function EditExistingResponseScreen() {
  const params = useLocalSearchParams();
  const responseId = params.responseId as string;
  const templateId = params.templateId as string;
  const type = params.type as 'closed' | 'open';
  const templateTitle = params.templateTitle as string || 'Template';


  const { getCurrentCompany } = useAuth();
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
  const { getAllCompanies } = useCompanies();

  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  
  // Store existing response items IDs to track which ones to delete
  const [existingResponseItems, setExistingResponseItems] = useState<Record<string, string>>({});
  
  // Store original response items data for comparison
  const [originalResponseItems, setOriginalResponseItems] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, [responseId, templateId, type]);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadCompanies();
      const loadedItems = await loadTemplateItems(); // This will initialize empty responses
      await loadResponse(loadedItems); // This will load response data and then call loadResponseItems
    } catch (error: any) {
      Alert.alert('Error', `Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const result = await getAllCompanies(1, 100);
      if (result && result.data && result.data.companies) {
        const companiesList = result.data.companies;
        setCompanies(companiesList);
      }
    } catch (error: any) {
      console.error('Error loading companies:', error);
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
        
        // Set company from response
        if (response.company_id) {
          const result = await getAllCompanies(1, 100);
          const companiesList = result?.data?.companies || [];
          const foundCompany = companiesList.find((c: Company) => c.id === response.company_id);
          if (foundCompany) {
            setSelectedCompany(foundCompany);
          }
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
        originalItemsMap[item.item_id] = {
          response: item.response,
          explanation: item.explanation || null
        };
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
          
          preFilledResponses[templateItem.id] = {
            item_id: templateItemId,
            question_index: templateItem.question_index,
            response: existingItem?.response || '',
            explanation: existingItem?.explanation || '',
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
          
          preFilledResponses[templateItem.id] = {
            item_id: templateItemId,
            question_index: templateItem.question_index,
            response: existingItem?.response || '',
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
      
      const items = await getItemsByTemplateId(templateId);
      
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
      Alert.alert('Error', `No se pudieron cargar las preguntas: ${error.message}`);
      return [];
    }
  };

  const handleClosedResponseChange = (itemId: string, response: 'C' | 'CP' | 'NC' | 'NA') => {
    setClosedResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        response
      }
    }));
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

  const handleSave = async () => {
    if (!selectedCompany) {
      Alert.alert('Error', 'Por favor selecciona una empresa');
      return;
    }

    if (!responseTitle.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para la respuesta');
      return;
    }

    try {
      setSaving(true);

      // Update the response
      const responseData: any = {
        title: responseTitle.trim()
      };
      
      if (type === 'open' && notes.trim()) {
        responseData.notes = notes.trim();
      } else if (type === 'open' && !notes.trim()) {
        responseData.notes = null;
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
          
          const hasValidResponse = responseData.response && 
                                   ['C', 'CP', 'NC', 'NA'].includes(responseData.response);
          
          if (!hasValidResponse) {
            // Skip items without valid response
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
            const responseChanged = originalItem?.response !== responseData.response;
            const explanationChanged = originalExplanation !== currentExplanation;
            
            if (responseChanged || explanationChanged) {
              // Data changed - update it
              const updateData: any = {
                response: responseData.response,
                explanation: currentExplanation
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
                response_item_id: existingResponseItemId
              };
              updatedExistingResponseItemsState[itemIdKey] = existingResponseItemId;
              updatedOriginalResponseItemsState[itemIdKey] = {
                response: responseData.response,
                explanation: currentExplanation
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
                response_item_id: existingResponseItemId
              };
              updatedExistingResponseItemsState[itemIdKey] = existingResponseItemId;
              if (!updatedOriginalResponseItemsState[itemIdKey]) {
                updatedOriginalResponseItemsState[itemIdKey] = {
                  response: responseData.response,
                  explanation: currentExplanation
                };
              }
            }
          } else {
            // Item doesn't exist - create it
            const createData: any = {
              response_id: responseId,
              item_id: itemIdKey,
              question_index: responseData.question_index,
              response: responseData.response,
              explanation: responseData.explanation?.trim() || null
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
              response_item_id: created.id
            };
            updatedExistingResponseItemsState[itemIdKey] = created.id;
            updatedOriginalResponseItemsState[itemIdKey] = {
              response: responseData.response,
              explanation: responseData.explanation?.trim() || null
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
            
            if (responseChanged) {
              // Data changed - update it
              const updateData: any = {
                response: trimmedResponse
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
                response_item_id: existingResponseItemId
              };
              updatedExistingResponseItemsState[itemIdKey] = existingResponseItemId;
              updatedOriginalResponseItemsState[itemIdKey] = {
                response: trimmedResponse
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
                response_item_id: existingResponseItemId
              };
              updatedExistingResponseItemsState[itemIdKey] = existingResponseItemId;
              if (!updatedOriginalResponseItemsState[itemIdKey]) {
                updatedOriginalResponseItemsState[itemIdKey] = {
                  response: trimmedResponse
                };
              }
            }
          } else {
            // Item doesn't exist - create it
            const itemIdKey = responseData.item_id ?? templateItem.id;
            const createData: any = {
              response_id: responseId,
              item_id: itemIdKey,
              question_index: responseData.question_index,
              response: trimmedResponse
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
              response_item_id: created.id
            };
            updatedExistingResponseItemsState[itemIdKey] = created.id;
            updatedOriginalResponseItemsState[itemIdKey] = {
              response: trimmedResponse
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
      
      Alert.alert(
        'Éxito',
        message,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
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
      
      // Log full error details for debugging
      console.error('[handleSave] Full error details:', {
        error,
        errorType: typeof error,
        errorMessage: error?.message,
        errorStack: error?.stack
      });
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
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
          <Text style={styles.loadingText}>Cargando respuesta...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Editar Respuesta</Text>
          <Text style={styles.headerSubtitle}>{templateTitle}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Título de la respuesta"
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
            <Text style={styles.categoryTitle}>{selectedCategory}</Text>
            
            {currentCategoryItems.map((item, index) => (
              <View key={item.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionIndex}>{item.question_index}</Text>
                  <Text style={styles.questionText}>{item.text}</Text>
                </View>

                {type === 'closed' ? (
                  <View style={styles.closedResponseContainer}>
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
                    <TextInput
                      style={styles.explanationInput}
                      placeholder="Explicación (opcional)"
                      value={closedResponses[item.id]?.explanation || ''}
                      onChangeText={(text) => handleClosedExplanationChange(item.id, text)}
                      multiline
                      placeholderTextColor="#9ca3af"
                    />
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

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
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
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  questionHeader: {
    marginBottom: 12,
  },
  questionIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
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
});

