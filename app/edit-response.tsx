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
}

interface OpenResponseData {
  item_id: string;
  question_index: string;
  response: string;
}

export default function EditResponseScreen() {
  const params = useLocalSearchParams();
  const templateId = params.templateId as string;
  const type = params.type as 'closed' | 'open';
  const templateTitle = params.templateTitle as string || 'Template';

  console.log('[EditResponseScreen] Params received:', { templateId, type, templateTitle });

  const { getCurrentCompany } = useAuth();
  const { getItemsByTemplateId } = type === 'closed' ? useClosedTemplateItems() : useOpenTemplateItems();
  const { createResponse: createClosedResponse } = useClosedInspectionResponses();
  const { createResponse: createOpenResponse } = useOpenInspectionResponses();
  const { createItem: createClosedResponseItem } = useClosedInspectionResponseItems();
  const { createItem: createOpenResponseItem } = useOpenInspectionResponseItems();
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

  useEffect(() => {
    loadCompanies();
    loadTemplateItems();
  }, [templateId, type]);

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
      console.log('[loadTemplateItems] templateId:', templateId);
      console.log('[loadTemplateItems] type:', type);
      
      if (!templateId) {
        throw new Error('No se proporcionó el ID del template');
      }
      
      const items = await getItemsByTemplateId(templateId);
      
      if (items && items.length > 0) {
        setTemplateItems(items);
        
        // Group items by category to set initial selected category
        const grouped = items.reduce((acc, item: any) => {
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
      Alert.alert('Error', `No se pudieron cargar las preguntas: ${error.message}`);
    } finally {
      setLoading(false);
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
      
      if (type === 'open' && notes.trim()) {
        responseData.notes = notes.trim();
      }

      let createdResponse;
      if (type === 'closed') {
        createdResponse = await createClosedResponse(responseData);
      } else {
        createdResponse = await createOpenResponse(responseData);
      }

      const responseId = createdResponse.id;

      // Create only response items that have valid responses
      const createdItems = [];
      
      if (type === 'closed') {
        // Process closed responses - only create items with valid responses
        for (const itemData of Object.values(closedResponses)) {
          const closedItem = itemData as ClosedResponseData;
          
          // Skip items without response or with invalid response
          if (!closedItem.response || 
              !['C', 'CP', 'NC', 'NA'].includes(closedItem.response)) {
            continue;
          }
          
          // Validate required fields
          if (!closedItem.item_id || !closedItem.question_index) {
            console.warn('Skipping item with missing required fields:', closedItem);
            continue;
          }
          
          // Ensure all values are explicitly set (no undefined)
          const responseItemData: any = {};
          responseItemData.response_id = responseId || null;
          responseItemData.item_id = closedItem.item_id || null;
          responseItemData.question_index = closedItem.question_index || null;
          responseItemData.response = closedItem.response || null;
          responseItemData.explanation = closedItem.explanation?.trim() || null;
          
          console.log('[handleSave] Closed item data:', {
            original: closedItem,
            processed: responseItemData,
            responseId: responseId,
            hasUndefined: Object.keys(responseItemData).some(k => responseItemData[k] === undefined)
          });
          
          // Final validation - ensure no undefined values
          if (Object.values(responseItemData).some(v => v === undefined)) {
            console.error('[handleSave] Found undefined in responseItemData:', responseItemData);
            throw new Error(`Valores undefined encontrados en item: ${closedItem.question_index}`);
          }
          
          if (!responseItemData.response_id || !responseItemData.item_id || 
              !responseItemData.question_index || !responseItemData.response) {
            console.warn('Skipping item with invalid data:', responseItemData);
            continue;
          }
          
          try {
            console.log('[handleSave] Sending to backend:', JSON.stringify(responseItemData, null, 2));
            const createdItem = await createClosedResponseItem(responseItemData);
            createdItems.push(createdItem);
          } catch (error: any) {
            console.error('Error creating closed response item:', error);
            throw new Error(`Error al crear respuesta para pregunta ${closedItem.question_index}: ${error.message}`);
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
          
          console.log('[handleSave] Open item data:', {
            original: openItem,
            processed: responseItemData,
            responseId: responseId,
            hasUndefined: Object.keys(responseItemData).some(k => responseItemData[k] === undefined)
          });
          
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
            console.log('[handleSave] Sending to backend:', JSON.stringify(responseItemData, null, 2));
            const createdItem = await createOpenResponseItem(responseItemData);
            createdItems.push(createdItem);
          } catch (error: any) {
            console.error('Error creating open response item:', error);
            throw new Error(`Error al crear respuesta para pregunta ${openItem.question_index}: ${error.message}`);
          }
        }
      }

      // Show success message
      if (createdItems.length === 0) {
        Alert.alert(
          'Respuesta creada',
          'La respuesta se creó exitosamente, pero no se guardaron items porque no hay preguntas respondidas. Puedes editar la respuesta más tarde para agregar respuestas.',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert(
          'Éxito',
          `Respuesta creada exitosamente con ${createdItems.length} pregunta(s) respondida(s)`,
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
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
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
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
          <Text style={styles.headerTitle}>Nueva Respuesta</Text>
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
            {saving ? 'Guardando...' : 'Guardar Respuesta'}
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

