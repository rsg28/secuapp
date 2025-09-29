import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  isTemplate: boolean;
  createdDate: string;
  lastModified: string;
  itemCount: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function ClosedInspectionsScreen() {
  const { user, hasMultipleCompanies, getCurrentCompany } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFormName, setNewFormName] = useState('');


  // Cargar formularios guardados al iniciar
  useEffect(() => {
    clearUnwantedTemplates();
    loadSavedForms();
    initializeDefaultTemplate();
  }, []);

  // Recargar formularios cuando la pantalla vuelva a tener foco
  useFocusEffect(
    React.useCallback(() => {
      loadSavedForms();
    }, [])
  );

  const loadSavedForms = async () => {
    try {
      const savedForms = await storage.loadForms();
      
      // Convertir formularios guardados al formato FormTemplate
      const userForms = savedForms.map((form: any) => ({
        id: form.id,
        title: form.title,
        description: form.description,
        category: form.category,
        isTemplate: form.isTemplate || false,
        createdDate: form.createdDate || '2024-01-15',
        lastModified: form.lastModified || '2024-01-15',
        itemCount: form.items ? form.items.length : 0,
      }));

      // Solo mostrar los formularios guardados (sin duplicar)
      setFormTemplates(userForms);
    } catch (error) {
      console.error('Error loading forms:', error);
      setFormTemplates([]);
    }
  };

  // Limpiar templates duplicados
  // Limpiar templates no deseados - mantener solo CCM2L y Productos Químicos únicos
  const clearUnwantedTemplates = async () => {
    try {
      const savedForms = await storage.loadForms();
      
      // Solo mantener templates con IDs específicos y eliminar duplicados
      const allowedTemplateIds = ['ccm2l-001', 'pq-001'];
      const seenIds = new Set();
      const filteredForms = savedForms.filter((form: any) => {
        if (allowedTemplateIds.includes(form.id) && !seenIds.has(form.id)) {
          seenIds.add(form.id);
          return true;
        }
        return false;
      });
      
      if (filteredForms.length !== savedForms.length) {
        await storage.saveForms(filteredForms);
        console.log(`Templates duplicados y no deseados eliminados. Mantenidos: ${filteredForms.length}`);
      }
    } catch (error) {
      console.error('Error clearing unwanted templates:', error);
    }
  };

  // Inicializar templates por defecto si no existen
  const initializeDefaultTemplate = async () => {
    try {
      const savedForms = await storage.loadForms();
      
      const defaultTemplates = [
        {
          id: 'pq-001',
          title: 'Productos Químicos - Checklist de Seguridad',
          description: 'Checklist de seguridad para manejo y almacenamiento de productos químicos con evaluación C/CP/NC/NA',
          category: 'productos-quimicos',
          isTemplate: true,
          createdDate: '2024-01-21',
          lastModified: '2024-01-21',
          items: [
            // PRODUCTOS QUÍMICOS
            { id: 'PQ-1', text: 'Existe una lista actualizada de productos químicos.', category: 'Productos Químicos' },
            { id: 'PQ-2', text: 'Todos los contenedores de materiales peligrosos están debidamente etiquetados, indicando la identidad del producto químico, el nombre y la dirección del fabricante y las advertencias de peligro apropiadas, haciendo uso del Sistema Globalmente Armonizado (SGA).', category: 'Productos Químicos' },
            { id: 'PQ-3', text: 'Los responsables de almacén están capacitados sobre los peligros químicos a los que están expuestos. (cómo leer y comprender la hoja MSDS y las etiquetas de los productos químicos, y qué precauciones tomar para evitar la exposición).', category: 'Productos Químicos' },
            { id: 'PQ-4', text: 'El almacenero o personal a cargo de almacén tiene capacitación en SGA.', category: 'Productos Químicos' },
            { id: 'PQ-5', text: 'Todos los productos químicos se almacenan de acuerdo con las recomendaciones del fabricante y usando los pictogramas correspondientes al Sistema Globalmente Armonizado (SGA)', category: 'Productos Químicos' },
            { id: 'PQ-6', text: 'Existe un proceso para comprobar que cada producto químico entrante va acompañado de la hoja MSDS.', category: 'Productos Químicos' },
            
            // ALMACÉN
            { id: 'PQ-7', text: 'Los pisos y pasillos están libres de obstáculos, cables eléctricos, mangueras, derrames y otros peligros que podrían causar que los empleados resbalen, tropiecen o caigan.', category: 'Almacén' },
            { id: 'PQ-8', text: 'Existen espacios libres debidamente señalizados y suficientemente seguros en los pasillos o zonas de paso donde se utilicen equipos mecánicos de manipulación.', category: 'Almacén' },
            { id: 'PQ-9', text: 'Los dispositivos de iluminación superior están bien ubicados, funcionan y están en buen estado.', category: 'Almacén' },
            { id: 'PQ-10', text: 'Existe una adecuada ventilación.', category: 'Almacén' },
            { id: 'PQ-11', text: 'Las estanterías están fijas y en buen estado.', category: 'Almacén' },
            { id: 'PQ-12', text: 'Los materiales sueltos o sin empaquetar que puedan caer de una pila se almacenan adecuadamente bloqueando, entrelazando o limitando la altura de la pila para evitar riesgos de caídas.', category: 'Almacén' },
            { id: 'PQ-13', text: 'Las bolsas, contenedores, etc. se almacenan en niveles que están apilados, bloqueados, entrelazados y limitados en altura para que sean estables y seguros para evitar deslizamientos o colapsos.', category: 'Almacén' },
            { id: 'PQ-14', text: 'Los empleados llevan EPPs cuando manipulan los productos químicos.', category: 'Almacén' },
            { id: 'PQ-15', text: 'Los extintores se inspeccionan mensualmente.', category: 'Almacén' },
          ],
        },
        {
          id: 'ccm2l-001',
          title: 'CCM2L - Checklist de Higiene Industrial',
          description: 'Checklist completo de higiene industrial según estándares CCM2L con evaluación C/CP/NC/NA',
          category: 'higiene-industrial',
          isTemplate: true,
          createdDate: '2024-01-20',
          lastModified: '2024-01-20',
          items: [
            // RUIDO
            { id: 'R1', text: 'Rotación de personal durante el uso de herramientas de poder según manual de uso para rotomartillo, amoladoras, radiales, cortadoras, entre otras; y en el caso de mesa de corte, cuando sea mayor a 4 horas continuas.', category: 'Ruido' },
            { id: 'R2', text: 'Doble protección auditiva durante el uso de herramientas de poder, mesa de corte, equipos móviles picando, inclusive para el personal aledaño, tanto en ambientes abiertos como cerrados.', category: 'Ruido' },
            { id: 'R3', text: 'Correcto sellado de los protectores auditivos, verificando su compatibilidad con otros EPP\'s, como caretas, cascos de soldador, cortavientos, entre otros. Protectores auditivos certificados con Norma ANSI según nuestro estándar de EPP del CCM2L.', category: 'Ruido' },
            { id: 'R4', text: 'Boquillas de aire comprimido con reducción de ruido para los equipos de arenado y granallado.', category: 'Ruido' },
            
            // VIBRACIÓN
            { id: 'V1', text: 'Para el uso de herramientas de poder se ha priorizado equipos con sistemas de absorción de vibración.', category: 'Vibración' },
            { id: 'V2', text: 'Se informa al área de Higiene Industrial de CCM2L sobre el ingreso de las herramientas de poder que no están listadas en "Tiempos máximos de exposición según tipo de equipo".', category: 'Vibración' },
            { id: 'V3', text: 'Rotulación de las herramientas de poder según el anexo 01 "Tiempos máximos de exposición según tipo de equipo" basado en los Límites máximos de exposición según la RM 375-2008-TR (Norma Básica de Ergonomía).', category: 'Vibración' },
            { id: 'V4', text: 'Rotación y registro de personal durante el uso de herramientas de poder que generen vibración (rotomartillo, vibropisón, demoledor, entre otros).', category: 'Vibración' },
            { id: 'V5', text: 'Uso de guantes antivibración (EN/ISO10819:2013) durante la manipulación de herramientas de poder que generen vibración (rotomartillo, vibropisón, demoledor, entre otros).', category: 'Vibración' },
            { id: 'V6', text: 'Constancia de mantenimiento del sistema de suspensión de los equipos móviles y la verificación del estado de los asientos se encuentra en el programa de mantenimiento de los equipos móviles solicitados por el CCM2L.', category: 'Vibración' },
            
            // ESTRÉS TÉRMICO
            { id: 'ET1', text: 'Puntos de hidratación cerrados con puerta, con superficies lisas y limpios en todos los trabajos. Contempla el uso individual de los vasos descartables, toma todos, etc., por cada trabajador.', category: 'Estrés Térmico' },
            { id: 'ET2', text: 'Puntos de sombra en todos los trabajos en superficie; con dimensiones que permitan la protección de los trabajadores bajo ella, a diferentes horas del día.', category: 'Estrés Térmico' },
            { id: 'ET3', text: 'Asegurar la entrega de bebidas rehidratantes al personal que participe en actividades con un gasto metabólico de tipo pesado (300-400 Kcal/hora) y muy pesado (>400 Kcal/hora).', category: 'Estrés Térmico' },
            { id: 'ET4', text: 'Rotación de personal y/o pausas para los trabajados realizados en superficies, o con una alta demanda física, como manipulación de cargas, entre otros.', category: 'Estrés Térmico' },
            
            // RADIACIONES NO IONIZANTES - UV/IR
            { id: 'RV1', text: 'Uso de protector solar, cortavientos y lentes oscuros en todos los trabajos en superficie.', category: 'Radiaciones UV/IR' },
            { id: 'RV2', text: 'Filtros de cristal para pantallas de soldadura (DIN para soldadura y radiación) según tipo de soldadura, acorde a lo indicado en la G050.', category: 'Radiaciones UV/IR' },
            
            // ILUMINACIÓN
            { id: 'IL1', text: 'Iluminación mínima de 50 luxes en todas las zonas de tránsito, como escaleras y pasadizos.', category: 'Iluminación' },
            { id: 'IL2', text: 'Iluminación mínima de 200 luxes en zonas de trabajo (iluminación localizada), mediante el uso de reflectores portátiles.', category: 'Iluminación' },
            { id: 'IL3', text: 'Iluminación mínima de 300 luxes en los trabajos con requerimiento visual de lectura o escritura, como en oficinas y lectura de planos en campo.', category: 'Iluminación' },
            { id: 'IL4', text: 'Linternas de casco o manual, para iluminar superficies de trabajo y/o zonas de tránsito.', category: 'Iluminación' },
            { id: 'IL5', text: 'Reflectores inalámbricos en último cuerpo de andamios, cámara bufa, debajo de losa de andén y pozos de bombeo.', category: 'Iluminación' },
            
            // MATERIAL PARTICULADO
            { id: 'MP1', text: 'Herramientas con sistema de absorción de polvo en la fuente (conexión directa a aspiradoras) en los trabajos de amolado, pulido, desbaste, corte, sopleteo o cualquier actividad que genere polución.', category: 'Material Particulado' },
            { id: 'MP2', text: 'Las aspiradoras deben ser industriales, contemplando el uso de filtros HEPA del tipo L, M o H.', category: 'Material Particulado' },
            { id: 'MP3', text: 'Mitigación de polvo en la fuente (absorción de polvo en la fuente, humedecer, regar, aislar, entre otros), en actividades donde se genere polución, como picado, perforación, barrido y movimiento de tierra.', category: 'Material Particulado' },
            { id: 'MP4', text: 'Mesa de corte de bloquetas o baldosas con inyección de agua en la fuente.', category: 'Material Particulado' },
            { id: 'MP5', text: 'Protección respiratoria aprobada por NIOSH en caso de que la concentración del agente químico supere el nivel de acción, o no se conozca su concentración. Según nuestro estándar de EPP del CCM2L.', category: 'Material Particulado' },
            { id: 'MP6', text: 'Correcto sellado de protección respiratoria, verificando aplicación de ajuste de presión positiva y presión negativa. Correcta limpieza y almacenamiento del EPP.', category: 'Material Particulado' },
            
            // SÍLICE
            { id: 'SI1', text: 'Encapsulado de la zona de trabajo, horarios que no afecten a personal aledaño y pausas en los trabajos de arenado o granallado.', category: 'Sílice' },
            { id: 'SI2', text: 'Protección respiratoria de flujo continuo (protección mínima = 1000TLV-OSHA), respirador tipo CE (NIOSH), y el aire de abastecimiento Tipo 1 - Grado D de aire respirable (ANSI-CGA-G-7.1-2018) para el arenador.', category: 'Sílice' },
            { id: 'SI3', text: 'Monitoreo ocupacional de sílice cristalina y polvo en los trabajos de arenado o granallado.', category: 'Sílice' },
            
            // HUMOS METÁLICOS
            { id: 'HM1', text: 'Para los trabajos en caliente en ambiente cerrado o semicerrado, se implementan controles en fuente, como: extractores localizados, ventilación forzada industrial o similares.', category: 'Humos Metálicos' },
            { id: 'HM2', text: 'Protección respiratoria aprobada por NIOSH con filtros para humos metálicos, con uso de cobertores de filtros evitando el daño por trabajos en caliente, según nuestro estándar de EPP de CCM2L.', category: 'Humos Metálicos' },
            { id: 'HM3', text: 'Monitoreos ocupacionales de humos metálicos, en caso se evidencia que exceda los Límites Máximos Permisibles según D.S 015-2008-TR.', category: 'Humos Metálicos' },
            { id: 'HM4', text: 'Correcto sellado de protección respiratoria, verificando aplicación de ajuste de presión positiva y presión negativa. Correcta limpieza y almacenamiento del EPP.', category: 'Humos Metálicos' },
            
            // VAPORES Y GASES
            { id: 'G1', text: 'Protección respiratoria con cartuchos para vapores aprobada por NIOSH, para los trabajos de pintura, uso de solventes o similares.', category: 'Vapores y Gases' },
            { id: 'G2', text: 'Monitoreo constante de gases en actividades como: soldadura aluminotérmica, espacios confinados y lugares donde se sospecha presencia de gases.', category: 'Vapores y Gases' },
            
            // ERGONOMÍA
            { id: 'ER1', text: 'Sillas con altura de asiento regulable, tapiz redondeado, acolchamiento de 20 mm, respaldo regulable en altura y ángulo de inclinación, con reposabrazos y 5 ruedas en los trabajos de oficina.', category: 'Ergonomía' },
            { id: 'ER2', text: 'Escritorios con dimensiones adecuadas que permitan el libre movimiento de los segmentos corporales. Prohibido colocar objetos que impidan el libre movimiento de los miembros inferiores en los trabajos de oficina.', category: 'Ergonomía' },
            { id: 'ER3', text: 'Laptop con soporte para elevar la altura de la pantalla, teclado y ratón externo.', category: 'Ergonomía' },
            { id: 'ER4', text: 'Ayudas mecánicas cuando las cargas superen los límites permisibles.', category: 'Ergonomía' },
            { id: 'ER5', text: 'Uso de aplicador de adhesivo a batería en lugar del aplicador manual, durante la inyección de resina.', category: 'Ergonomía' },
            { id: 'ER6', text: 'Evitar los trabajos a nivel de piso, elevando el plano de trabajo a fin de evitar la flexión de espalda. Asimismo, se deben usar escaleras o apoyos adecuados cuando el plano de trabajo se encuentre por encima del nivel de los hombros.', category: 'Ergonomía' },
            { id: 'ER7', text: 'Realizar pausas durante trabajos con movimientos repetitivos o con posturas forzadas, siguiendo las recomendaciones de la RM 375-2008-TR.', category: 'Ergonomía' },
            { id: 'ER8', text: 'Colocar asas cuando se transporten materiales con un tipo de agarre malo, a fin de que se convierta en un agarre bueno o regular. Prohibido cargar sobre cabeza y traslado por escaleras y/o a través de andamios.', category: 'Ergonomía' },
            { id: 'ER9', text: 'Uso obligatorio de hombreras para traslado de materiales sobre hombros. Asimismo, el uso de rodilleras para trabajos en cuclillas o arrodillados, perforación y resane.', category: 'Ergonomía' },
            
            // BIOLÓGICOS
            { id: 'B1', text: 'Mantener puertas y/o ventanas abiertas en oficinas, vestidores y comedores, para asegurar una adecuada ventilación.', category: 'Biológicos' },
            { id: 'B2', text: 'Eliminación de recipientes y espacios que acumulan agua, tanto en el interior como en el exterior. Si no se pueden eliminar, evitar que acumule, volteándolos, tapándolos o cambiándoles el agua.', category: 'Biológicos' },
            { id: 'B3', text: 'Control y eliminación del crecimiento de plantas alrededor de oficinas y servicios de bienestar, producto de la humedad por fugas de agua o similares.', category: 'Biológicos' },
          ],
        },
      ];

      // Verificar cuáles templates ya existen
      const existingIds = savedForms.map((form: any) => form.id);
      const templatesToAdd = defaultTemplates.filter(template => !existingIds.includes(template.id));
      
      // Agregar solo los templates que no existen
      for (const template of templatesToAdd) {
        await storage.addForm(template);
      }
      
      if (templatesToAdd.length > 0) {
        console.log(`${templatesToAdd.length} templates por defecto inicializados`);
      }
    } catch (error) {
      console.error('Error initializing default templates:', error);
    }
  };

  const categories: Category[] = [
    { id: 'todos', name: 'Todos', icon: 'apps', color: '#6366f1' },
    { id: 'higiene-industrial', name: 'Higiene Industrial', icon: 'medical', color: '#8b5cf6' },
    { id: 'productos-quimicos', name: 'Productos Químicos', icon: 'flask', color: '#ef4444' },
  ];

  const getFilteredForms = () => {
    if (selectedCategory === 'todos') {
      return formTemplates;
    }
    return formTemplates.filter(form => form.category === selectedCategory);
  };

  const getAvailableCategories = () => {
    // Siempre mostrar "Todos"
    const availableCategories = [categories[0]]; // "Todos" es el primero
    
    // Agregar solo categorías que tengan formularios
    categories.slice(1).forEach(category => {
      const hasTemplates = formTemplates.some(form => form.category === category.id);
      if (hasTemplates) {
        availableCategories.push(category);
      }
    });
    
    return availableCategories;
  };

  const handleAddForm = () => {
    Alert.alert(
      'Estamos trabajando en ello',
      'Esta funcionalidad estará disponible próximamente',
      [{ text: 'Entendido', style: 'default' }]
    );
  };







  const handleFormPress = (form: FormTemplate) => {
    const company = getCurrentCompany();
    if (company) {
      // Si es el template CCM2L o Productos Químicos, usar la pantalla especializada
      if (form.id === 'ccm2l-001' || form.id === 'pq-001') {
        router.push({
          pathname: '/ccm2l-inspection',
          params: {
            id: form.id,
            companyId: company.id,
            companyName: company.name
          }
        } as any);
      } else {
        // Para otros templates, usar la pantalla estándar
      router.push(`/form-detail?id=${form.id}&companyId=${company.id}&companyName=${company.name}`);
      }
    } else {
      Alert.alert('Error', 'No hay empresa seleccionada');
    }
  };

  const handleMenuPress = (form: FormTemplate) => {
    setSelectedForm(form);
    setShowMenuDropdown(true);
  };

  const handleCloseMenu = () => {
    setShowMenuDropdown(false);
    setSelectedForm(null);
  };

  const handleEditForm = () => {
    if (selectedForm) {
      handleCloseMenu();
      // Navegar a la pantalla de edición
      router.push(`/create-form?editId=${selectedForm.id}`);
    }
  };

  const handleRenameForm = () => {
    if (selectedForm) {
      setNewFormName(selectedForm.title);
      handleCloseMenu();
      setShowRenameModal(true);
    }
  };

  const handleConfirmRename = async () => {
    if (!selectedForm || !newFormName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre válido');
      return;
    }

    try {
      // Actualizar el formulario en AsyncStorage
      const savedForms = await storage.loadForms();
      const formToUpdate = savedForms.find((form: any) => form.id === selectedForm.id);
      
      if (formToUpdate) {
        formToUpdate.title = newFormName.trim();
        formToUpdate.lastModified = new Date().toISOString().split('T')[0];
        await storage.updateForm(formToUpdate);
        
        // Actualizar el estado local
        setFormTemplates(prev => prev.map(form => 
          form.id === selectedForm.id 
            ? { ...form, title: newFormName.trim(), lastModified: new Date().toISOString().split('T')[0] }
            : form
        ));
      }
      
      setShowRenameModal(false);
      setSelectedForm(null);
      setNewFormName('');
    } catch (error) {
      console.error('Error renaming form:', error);
      Alert.alert('Error', 'No se pudo cambiar el nombre del template');
    }
  };

  const handleDeleteForm = () => {
    if (!selectedForm) return;
    
    Alert.alert(
      'Eliminar Template',
      `¿Estás seguro de que deseas eliminar "${selectedForm.title}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setFormTemplates(prev => prev.filter(f => f.id !== selectedForm.id));
            
            // Si la categoría actual ya no tiene formularios, cambiar a "todos"
            const remainingInCategory = formTemplates.filter(
              f => f.id !== selectedForm.id && f.category === selectedCategory
            );
            
            if (remainingInCategory.length === 0 && selectedCategory !== 'todos') {
              setSelectedCategory('todos');
            }

            // Si es un template personalizado, eliminarlo de AsyncStorage
            if (!selectedForm.isTemplate) {
              try {
                await storage.deleteForm(selectedForm.id);
              } catch (error) {
                console.error('Error deleting template from AsyncStorage:', error);
              }
            }
            
            handleCloseMenu();
          },
        },
      ],
    );
  };

  const filteredForms = getFilteredForms();
  const availableCategories = getAvailableCategories();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inspecciones Cerradas</Text>
          <Text style={styles.headerSubtitle}>
            Gestiona tus templates de inspección de seguridad
          </Text>
        </View>
      </View>

      <View style={styles.contentOverlay}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Categorías */}
        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {availableCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                  { borderColor: category.color }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={16} 
                  color={selectedCategory === category.id ? '#fff' : category.color} 
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive
                ]}>
                  {category.name}
            </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          </View>

        {/* Lista de Templates */}
        <View style={styles.formsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'todos' ? 'Todos los Templates' : 
               categories.find(c => c.id === selectedCategory)?.name || 'Templates'}
              {' '}({filteredForms.length})
            </Text>
            <TouchableOpacity style={styles.addButtonFloating} onPress={handleAddForm}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Nuevo</Text>
            </TouchableOpacity>
          </View>

          {filteredForms.map((form) => (
            <View key={form.id} style={styles.formCard}>
              <TouchableOpacity 
                style={styles.formCardContent}
                onPress={() => handleFormPress(form)}
              >
                <View style={styles.formCardHeader}>
                  <View style={styles.formInfo}>
                    <View style={styles.formTitleRow}>
                      <Text style={styles.formTitle}>{form.title}</Text>
                      {form.isTemplate && (
                        <View style={styles.templateBadge}>
                          <Text style={styles.templateBadgeText}>Template</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.formDescription}>{form.description}</Text>
                  </View>
                  <View style={[
                    styles.categoryIcon,
                    { backgroundColor: categories.find(c => c.id === form.category)?.color + '20' }
                  ]}>
                    <Ionicons 
                      name={categories.find(c => c.id === form.category)?.icon as any || 'document'}
                      size={20} 
                      color={categories.find(c => c.id === form.category)?.color || '#6366f1'} 
                    />
                  </View>
                </View>

                <View style={styles.formCardFooter}>
                  <Text style={styles.formMeta}>
                    {form.itemCount} elementos
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* Botón de menú en esquina inferior derecha */}
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => handleMenuPress(form)}
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#6b7280" />
              </TouchableOpacity>
              
              {/* Dropdown menu */}
              {showMenuDropdown && selectedForm?.id === form.id && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity 
                    style={styles.dropdownOption}
                    onPress={handleEditForm}
                  >
                    <Ionicons name="create-outline" size={16} color="#3b82f6" />
                    <Text style={styles.dropdownOptionText}>Editar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.dropdownOption}
                    onPress={handleRenameForm}
                  >
                    <Ionicons name="text-outline" size={16} color="#f59e0b" />
                    <Text style={styles.dropdownOptionText}>Cambiar nombre</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.dropdownOption}
                    onPress={handleDeleteForm}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={[styles.dropdownOptionText, { color: '#ef4444' }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Espacio adicional para el bottom tab */}
        <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Overlay para cerrar el menú cuando se toque fuera */}
      {showMenuDropdown && (
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={handleCloseMenu}
        />
      )}

      {/* Modal de Cambiar Nombre */}
      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.renameModalOverlay}>
          <View style={styles.renameModalContent}>
            <Text style={styles.renameModalTitle}>Cambiar nombre</Text>
            
            <TextInput
              style={styles.renameInput}
              value={newFormName}
              onChangeText={setNewFormName}
              placeholder="Nombre del template"
              autoFocus={true}
            />
            
            <View style={styles.renameModalButtons}>
              <TouchableOpacity 
                style={styles.renameCancelButton}
                onPress={() => {
                  setShowRenameModal(false);
                  setNewFormName('');
                  setSelectedForm(null);
                }}
              >
                <Text style={styles.renameCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.renameConfirmButton}
                onPress={handleConfirmRename}
              >
                <Text style={styles.renameConfirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#22c55a',
    padding: 20,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dcfce7',
    marginTop: 2,
  },
  contentOverlay: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoriesScrollContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#fff',
  },
  formsContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButtonFloating: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  formCardContent: {
    padding: 16,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  formInfo: {
    flex: 1,
    marginRight: 12,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  templateBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  templateBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#3b82f6',
  },
  formDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bottomSpacing: {
    height: 120,
  },
  // Estilos para el botón de menú
  menuButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  // Estilos para el dropdown menu
  dropdownMenu: {
    position: 'absolute',
    bottom: 45,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  // Overlay para cerrar el menú
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  // Estilos para el modal de cambiar nombre
  renameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  renameModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  renameModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  renameCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  renameCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  renameConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  renameConfirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },

});


