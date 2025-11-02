import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClosedInspectionTemplates } from '../../hooks/useClosedInspectionTemplates';
import { useClosedTemplateItems } from '../../hooks/useClosedTemplateItems';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DevScreen() {
  const { templates, loading, error, getAllTemplates, deleteTemplate } = useClosedInspectionTemplates();
  const { getItemsByTemplateId, deleteItem } = useClosedTemplateItems();
  const [testResults, setTestResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [tokenDebug, setTokenDebug] = useState<string | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    handleTestGetAllTemplates();
  }, []);

  const handleTestGetAllTemplates = async () => {
    try {
      setShowResults(true);
      setTestResults(null);
      
      // First get the token to debug
      const token = await AsyncStorage.getItem('authToken');
      setTokenDebug(token);
      
      // Now call the API
      const result = await getAllTemplates(1, 10);
      setTestResults(result);
      Alert.alert('Success', 'Templates fetched successfully!');
    } catch (err: any) {
      Alert.alert('Error', `Failed to fetch templates: ${err.message}`);
      setTestResults({ error: err.message, stack: err.stack });
    }
  };

  const handleCheckToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setTokenDebug(token);
      if (token) {
        Alert.alert('Token Found', `Token length: ${token.length} characters`);
      } else {
        Alert.alert('No Token', 'No token found in AsyncStorage');
      }
    } catch (err: any) {
      Alert.alert('Error', `Failed to get token: ${err.message}`);
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateTitle: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar "${templateTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // First, try to get all items for this template
              try {
                const items = await getItemsByTemplateId(templateId);
                
                // Delete all items
                if (items && items.length > 0) {
                  for (const item of items) {
                    await deleteItem(item.id);
                  }
                }
              } catch (itemsError: any) {
                // If there are no items or error getting items, continue anyway
                console.log('No items found or error getting items:', itemsError.message);
              }
              
              // Then delete the template
              await deleteTemplate(templateId);
              
              // Refresh the templates list
              await handleTestGetAllTemplates();
              
              Alert.alert('Éxito', 'Template eliminado correctamente');
            } catch (err: any) {
              Alert.alert('Error', `No se pudo eliminar el template: ${err.message}`);
            }
          }
        }
      ]
    );
  };

  const clearResults = () => {
    setTestResults(null);
    setShowResults(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="code-slash" size={24} color="#1e40af" />
        <Text style={styles.headerTitle}>Dev Tools</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Test Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 API Testing</Text>
          
          <TouchableOpacity 
            style={styles.checkTokenButton} 
            onPress={handleCheckToken}
          >
            <Ionicons name="key" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Check Auth Token</Text>
          </TouchableOpacity>

          {tokenDebug && (
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>Token Value:</Text>
              <Text style={styles.tokenText}>{tokenDebug || 'null'}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={handleTestGetAllTemplates}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="play" size={20} color="#fff" />
                <Text style={styles.testButtonText}>Test getAllTemplates</Text>
              </>
            )}
          </TouchableOpacity>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ Error from Hook: {error}</Text>
            </View>
          )}
        </View>

        {/* Results Section */}
        {showResults && (
          <View style={styles.section}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>📊 Results</Text>
              <TouchableOpacity onPress={clearResults} style={styles.clearButton}>
                <Ionicons name="close" size={20} color="#dc2626" />
              </TouchableOpacity>
            </View>

            {testResults && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>
                  {testResults.error ? '❌ Error Details:' : '✅ getAllTemplates Response:'}
                </Text>
                <ScrollView style={styles.jsonContainer}>
                  <Text style={styles.jsonText}>
                    {JSON.stringify(testResults, null, 2)}
                  </Text>
                </ScrollView>
              </View>
            )}

            {templates.length > 0 && (
              <View style={styles.templatesContainer}>
                <Text style={styles.resultsTitle}>Templates ({templates.length} items):</Text>
                {templates.map((template: any, index: number) => (
                  <View key={template.id || index} style={styles.templateItem}>
                    <View style={{flex: 1}}>
                      <Text style={styles.templateTitle}>{template.title}</Text>
                      <Text style={styles.templateDescription}>{template.description}</Text>
                      <Text style={styles.templateCategory}>Categoría: {template.temp_category || 'N/A'}</Text>
                      <Text style={styles.templateId}>ID: {template.id}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteTemplate(template.id, template.title)}
                    >
                      <Ionicons name="trash" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Info</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              • This dev tab helps test API endpoints
            </Text>
            <Text style={styles.infoText}>
              • Use "Test getAllTemplates" to fetch closed inspection templates
            </Text>
            <Text style={styles.infoText}>
              • Results show both API response and component state
            </Text>
            <Text style={styles.infoText}>
              • Check console for detailed logs
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  checkTokenButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: '#1e40af',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  tokenContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  tokenText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#1f2937',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    padding: 8,
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  jsonContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  templatesContainer: {
    marginTop: 16,
  },
  templateItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  templateCategory: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '500',
    marginBottom: 4,
  },
  templateId: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  infoContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 8,
    lineHeight: 20,
  },
});
