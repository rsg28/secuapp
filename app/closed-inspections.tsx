import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
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
import { useClosedInspectionTemplates } from '../hooks/useClosedInspectionTemplates';
import { useClosedTemplateItems } from '../hooks/useClosedTemplateItems';

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  isTemplate: boolean;
  createdDate: string;
  lastModified: string;
  itemCount: number;
  user_id?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function ClosedInspectionsScreen() {
  const { user } = useAuth();
  const { templates, createTemplate, deleteTemplate, getTemplatesByUserId, updateTemplate } = useClosedInspectionTemplates();
  const { getItemsByTemplateId, createItem, deleteItem, updateItem } = useClosedTemplateItems();
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<Category[]>([]);
  
  // States for creating new template
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('');
  const [newTemplateItems, setNewTemplateItems] = useState<Array<{
    text: string, 
    category: string, 
    question_type: 'text' | 'single_choice' | 'multiple_choice',
    options: string[]
  }>>([{text: '', category: '', question_type: 'text', options: []}]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  
  // States for viewing items
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedTemplateItems, setSelectedTemplateItems] = useState<Array<{category: string, items: any[]}>>([]);
  const [selectedCategoryInModal, setSelectedCategoryInModal] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // States for editing template
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [editTemplateTitle, setEditTemplateTitle] = useState('');
  const [editTemplateDescription, setEditTemplateDescription] = useState('');
  const [editTemplateCategory, setEditTemplateCategory] = useState('');
  const [editTemplateItems, setEditTemplateItems] = useState<Array<{
    id?: string, 
    text: string, 
    category: string,
    question_type?: 'text' | 'single_choice' | 'multiple_choice',
    options?: string[]
  }>>([]);


  // Convertir templates de DB a formato FormTemplate cuando cambien
  useEffect(() => {
    if (templates && templates.length > 0) {
      const dbTemplates: FormTemplate[] = templates.map((template: any) => ({
        id: template.id,
        title: template.title,
        description: template.description || '',
        category: template.temp_category || 'productos-quimicos',
        isTemplate: true,
        createdDate: template.created_at ? new Date(template.created_at).toISOString().split('T')[0] : '2024-01-01',
        lastModified: template.updated_at ? new Date(template.updated_at).toISOString().split('T')[0] : '2024-01-01',
        itemCount: 0,
        user_id: template.user_id || undefined,
      }));

      setFormTemplates(dbTemplates);
    } else {
      // Si no hay templates, limpiar la lista
      setFormTemplates([]);
    }
  }, [templates]);

  // Detectar categorías únicas de los templates y actualizar dynamicCategories
  useEffect(() => {
    if (formTemplates && formTemplates.length > 0) {
      // Obtener todas las categorías únicas de los templates
      const uniqueCategories = [...new Set(formTemplates.map(template => template.category))];
      
      // Crear categorías dinámicas con color uniforme
      const detectedCategories: Category[] = uniqueCategories.map(category => {
        return {
          id: category,
          name: category,
          icon: '',
          color: '#6366f1',
        };
      }).sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabéticamente
      
      setDynamicCategories(detectedCategories);
    }
  }, [formTemplates]);

  // Cargar templates del servidor al iniciar
  useEffect(() => {
    if (user?.id) {
      getTemplatesByUserId(user.id, 1, 100).catch(() => {});
    }
  }, [user?.id]);

  // Recargar templates del servidor cuando la pantalla vuelva a tener foco
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        getTemplatesByUserId(user.id, 1, 100).catch(() => {});
      }
    }, [user?.id, getTemplatesByUserId])
  );

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
      }
    } catch (error) {
      console.error('Error initializing default templates:', error);
    }
  };

  const categories: Category[] = [
    { id: 'todos', name: 'Todos', icon: '', color: '#6366f1' },
    { id: 'higiene-industrial', name: 'Higiene Industrial', icon: '', color: '#6366f1' },
    { id: 'productos-quimicos', name: 'Productos Químicos', icon: '', color: '#6366f1' },
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
    
    // Usar las categorías dinámicas detectadas de la base de datos
    if (dynamicCategories && dynamicCategories.length > 0) {
      availableCategories.push(...dynamicCategories);
    } else {
      // Fallback: agregar solo categorías que tengan formularios (comportamiento anterior)
      categories.slice(1).forEach(category => {
        const hasTemplates = formTemplates.some(form => form.category === category.id);
        if (hasTemplates) {
          availableCategories.push(category);
        }
      });
    }
    
    return availableCategories;
  };

  const handleAddForm = () => {
    setNewTemplateTitle('');
    setNewTemplateDescription('');
    setNewTemplateCategory('');
    setNewTemplateItems([{text: '', category: '', question_type: 'text', options: []}]);
    setIsCreatingTemplate(false);
    setShowCreateModal(true);
  };
  
  const handleCreateTemplate = async () => {
    if (isCreatingTemplate) {
      return;
    }
    // Validate inputs
    if (!newTemplateTitle.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }
    if (!newTemplateCategory.trim()) {
      Alert.alert('Error', 'La categoría es requerida');
      return;
    }
    if (!newTemplateDescription.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }
    const trimmedItems = newTemplateItems.map((item) => ({
      text: item.text.trim(),
      category: item.category.trim(),
      question_type: item.question_type || 'text',
      options: item.options || []
    }));
    const hasEmptyItem = trimmedItems.some(item => !item.text || !item.category);
    if (trimmedItems.length === 0 || hasEmptyItem) {
      Alert.alert('Error', 'Completa todos los items con categoría y texto.');
      return;
    }
    // Validate options for choice questions
    const hasInvalidChoice = trimmedItems.some(item => {
      if (item.question_type === 'single_choice' || item.question_type === 'multiple_choice') {
        return !item.options || item.options.length < 2 || item.options.some(opt => !opt.trim());
      }
      return false;
    });
    if (hasInvalidChoice) {
      Alert.alert('Error', 'Las preguntas de tipo choice deben tener al menos 2 opciones válidas.');
      return;
    }
    
    // Check if a template with the same title + category already exists
    const existingTemplate = templates.find(
      (t: any) => t.title.toLowerCase() === newTemplateTitle.trim().toLowerCase() && 
                  t.temp_category?.toLowerCase() === newTemplateCategory.trim().toLowerCase()
    );
    
    if (existingTemplate) {
      Alert.alert('Error', 'Ya existe un template con este título y categoría');
      return;
    }
    
    setIsCreatingTemplate(true);
    try {
      // Get user info for created_by
      const userId = user?.id;
      if (!userId) {
        Alert.alert('Error', 'No se pudo identificar al usuario');
        return;
      }
      
      // Create template
      const templateData = {
        title: newTemplateTitle.trim(),
        description: newTemplateDescription.trim(),
        temp_category: newTemplateCategory.trim(),
        created_by: userId,
        user_id: userId // Templates created by users are only visible to that user by default
      };
      
      const newTemplate = await createTemplate(templateData);
      
      // Filter valid items (with both text and category)
      // Create items for the template if there are any
      if (trimmedItems.length > 0) {
        for (let i = 0; i < trimmedItems.length; i++) {
          const item = trimmedItems[i];
          const itemData: any = {
            template_id: newTemplate.id,
            category: item.category,
            question_index: i + 1,
            text: item.text,
            question_type: item.question_type,
            sort_order: i + 1
          };
          // Add options only for choice types
          if (item.question_type === 'single_choice' || item.question_type === 'multiple_choice') {
            itemData.options = item.options.filter(opt => opt.trim());
          }
          await createItem(itemData);
        }
      }
      
      // Refresh templates list from database
      if (user?.id) {
        await getTemplatesByUserId(user.id, 1, 100);
      }
      
      // Close modal and reset
      setShowCreateModal(false);
      setNewTemplateTitle('');
      setNewTemplateDescription('');
      setNewTemplateCategory('');
      setNewTemplateItems([{text: '', category: '', question_type: 'text', options: []}]);
      
      Alert.alert('Éxito', 'Template creado correctamente');
    } catch (error: any) {
      const errorMessage = error?.message || 'No se pudo crear el template';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsCreatingTemplate(false);
    }
  };
  
  const addNewItem = () => {
    setNewTemplateItems([...newTemplateItems, {text: '', category: '', question_type: 'text', options: []}]);
  };
  
  const updateNewItem = (index: number, field: 'text' | 'category' | 'question_type', value: string | 'text' | 'single_choice' | 'multiple_choice') => {
    const updatedItems = [...newTemplateItems];
    if (field === 'question_type') {
      updatedItems[index].question_type = value as 'text' | 'single_choice' | 'multiple_choice';
      // Reset options when changing to text
      if (value === 'text') {
        updatedItems[index].options = [];
      } else if (updatedItems[index].options.length === 0) {
        // Initialize with 2 empty options for choice types
        updatedItems[index].options = ['', ''];
      }
    } else {
      (updatedItems[index] as any)[field] = value;
    }
    setNewTemplateItems(updatedItems);
  };

  const updateNewItemOption = (itemIndex: number, optionIndex: number, value: string) => {
    const updatedItems = [...newTemplateItems];
    if (!updatedItems[itemIndex].options) {
      updatedItems[itemIndex].options = [];
    }
    updatedItems[itemIndex].options[optionIndex] = value;
    setNewTemplateItems(updatedItems);
  };

  const addNewItemOption = (itemIndex: number) => {
    const updatedItems = [...newTemplateItems];
    if (!updatedItems[itemIndex].options) {
      updatedItems[itemIndex].options = [];
    }
    updatedItems[itemIndex].options.push('');
    setNewTemplateItems(updatedItems);
  };

  const removeNewItemOption = (itemIndex: number, optionIndex: number) => {
    const updatedItems = [...newTemplateItems];
    if (updatedItems[itemIndex].options && updatedItems[itemIndex].options.length > 2) {
      updatedItems[itemIndex].options = updatedItems[itemIndex].options.filter((_, i) => i !== optionIndex);
      setNewTemplateItems(updatedItems);
    }
  };
  
  const removeNewItem = (index: number) => {
    if (newTemplateItems.length > 1) {
      setNewTemplateItems(newTemplateItems.filter((_, i) => i !== index));
    }
  };
  
  const addEditItem = () => {
    setEditTemplateItems([...editTemplateItems, {text: '', category: '', question_type: 'text', options: []}]);
  };
  
  const updateEditItem = (index: number, field: 'text' | 'category' | 'question_type', value: string | 'text' | 'single_choice' | 'multiple_choice') => {
    const updatedItems = [...editTemplateItems];
    if (field === 'question_type') {
      updatedItems[index].question_type = value as 'text' | 'single_choice' | 'multiple_choice';
      // Reset options when changing to text
      if (value === 'text') {
        updatedItems[index].options = [];
      } else if (!updatedItems[index].options || updatedItems[index].options!.length === 0) {
        // Initialize with 2 empty options for choice types
        updatedItems[index].options = ['', ''];
      }
    } else {
      (updatedItems[index] as any)[field] = value;
    }
    setEditTemplateItems(updatedItems);
  };

  const updateEditItemOption = (itemIndex: number, optionIndex: number, value: string) => {
    const updatedItems = [...editTemplateItems];
    if (!updatedItems[itemIndex].options) {
      updatedItems[itemIndex].options = [];
    }
    updatedItems[itemIndex].options![optionIndex] = value;
    setEditTemplateItems(updatedItems);
  };

  const addEditItemOption = (itemIndex: number) => {
    const updatedItems = [...editTemplateItems];
    if (!updatedItems[itemIndex].options) {
      updatedItems[itemIndex].options = [];
    }
    updatedItems[itemIndex].options!.push('');
    setEditTemplateItems(updatedItems);
  };

  const removeEditItemOption = (itemIndex: number, optionIndex: number) => {
    const updatedItems = [...editTemplateItems];
    if (updatedItems[itemIndex].options && updatedItems[itemIndex].options!.length > 2) {
      updatedItems[itemIndex].options = updatedItems[itemIndex].options!.filter((_, i) => i !== optionIndex);
      setEditTemplateItems(updatedItems);
    }
  };
  
  const removeEditItem = (index: number) => {
    if (editTemplateItems.length > 1) {
      setEditTemplateItems(editTemplateItems.filter((_, i) => i !== index));
    }
  };







  const handleFormPress = async (form: FormTemplate) => {
    try {
      // Fetch items for this template
      const items = await getItemsByTemplateId(form.id);
      
      // Group items by category
      const groupedByCategory: { [key: string]: any[] } = {};
      if (items && items.length > 0) {
        items.forEach((item: any) => {
          const category = item.category || 'Sin categoría';
          if (!groupedByCategory[category]) {
            groupedByCategory[category] = [];
          }
          groupedByCategory[category].push(item);
        });
      }
      
      // Convert to array format
      const groupedArray = Object.keys(groupedByCategory).map(category => ({
        category,
        items: groupedByCategory[category]
      }));
      
      setSelectedTemplateItems(groupedArray);
      // Establecer la primera categoría como seleccionada por defecto
      if (groupedArray.length > 0) {
        setSelectedCategoryInModal(groupedArray[0].category);
      } else {
        setSelectedCategoryInModal(null);
      }
      setShowCategoryDropdown(false);
      setShowItemsModal(true);
    } catch (error: any) {
      Alert.alert('Error', `No se pudieron cargar los items del template: ${error.message}`);
    }
  };

  const handleEditForm = async (form: FormTemplate) => {
    try {
      setEditingTemplate(form);
      setEditTemplateTitle(form.title);
      setEditTemplateDescription(form.description);
      setEditTemplateCategory(form.category);
      
      // Fetch current items
      const items = await getItemsByTemplateId(form.id);
      
      // Convert items to edit format
      const itemsForEdit = items.map((item: any) => ({
        id: item.id,
        text: item.text,
        category: item.category,
        question_type: item.question_type || 'text',
        options: item.options && Array.isArray(item.options) ? item.options : (typeof item.options === 'string' ? JSON.parse(item.options) : [])
      }));
      
      setEditTemplateItems(itemsForEdit.length > 0 ? itemsForEdit : [{text: '', category: '', question_type: 'text', options: []}]);
      setShowEditModal(true);
    } catch (error: any) {
      Alert.alert('Error', `No se pudieron cargar los items del template: ${error.message}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate) return;
    
    // Validate inputs
    if (!editTemplateTitle.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }
    if (!editTemplateCategory.trim()) {
      Alert.alert('Error', 'La categoría es requerida');
      return;
    }
    if (!editTemplateDescription.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }
    
    try {
      // Update template
      await updateTemplate(editingTemplate.id, {
        title: editTemplateTitle.trim(),
        description: editTemplateDescription.trim(),
        temp_category: editTemplateCategory.trim()
      });
      
      // Filter valid items
      const validItems = editTemplateItems.filter(item => item.text.trim() && item.category.trim());
      
      // Validate options for choice questions
      const hasInvalidChoice = validItems.some(item => {
        if (item.question_type === 'single_choice' || item.question_type === 'multiple_choice') {
          return !item.options || item.options.length < 2 || item.options.some(opt => !opt.trim());
        }
        return false;
      });
      if (hasInvalidChoice) {
        Alert.alert('Error', 'Las preguntas de tipo choice deben tener al menos 2 opciones válidas.');
        return;
      }
      
      // Get current items from database
      const currentItems = await getItemsByTemplateId(editingTemplate.id);
      const currentItemIds = Array.isArray(currentItems) ? currentItems.map((item: any) => item.id) : [];
      const editItemIds = validItems.filter(item => item.id).map(item => item.id!);
      
      // Determine which items to delete, create, or update
      const itemsToDelete = currentItemIds.filter((id: string) => !editItemIds.includes(id));
      const itemsToCreate = validItems.filter(item => !item.id);
      const itemsToUpdate = validItems.filter(item => item.id);
      
      // Delete items
      for (const itemId of itemsToDelete) {
        try {
          await deleteItem(itemId);
        } catch (error) {
          console.error('Error deleting item:', error);
        }
      }
      
      // Create new items
      const existingCount = itemsToUpdate.length;
      for (let i = 0; i < itemsToCreate.length; i++) {
        const item = itemsToCreate[i];
        const itemData: any = {
          template_id: editingTemplate.id,
          category: item.category.trim(),
          question_index: existingCount + i + 1,
          text: item.text.trim(),
          question_type: item.question_type || 'text',
          sort_order: existingCount + i + 1
        };
        // Add options only for choice types
        if (item.question_type === 'single_choice' || item.question_type === 'multiple_choice') {
          itemData.options = item.options ? item.options.filter((opt: string) => opt.trim()) : [];
        }
        await createItem(itemData);
      }
      
      // Update existing items
      for (let i = 0; i < itemsToUpdate.length; i++) {
        const item = itemsToUpdate[i];
        if (item.id) {
          const updateData: any = {
            category: item.category.trim(),
            text: item.text.trim(),
            question_index: i + 1,
            question_type: item.question_type || 'text',
            sort_order: i + 1
          };
          // Add options only for choice types
          if (item.question_type === 'single_choice' || item.question_type === 'multiple_choice') {
            updateData.options = item.options ? item.options.filter((opt: string) => opt.trim()) : [];
          }
          await updateItem(item.id, updateData);
        }
      }
      
      // Refresh templates list from database
      if (user?.id) {
        await getTemplatesByUserId(user.id, 1, 100);
      }
      
      // Close modal and reset
      setShowEditModal(false);
      setEditingTemplate(null);
      setEditTemplateTitle('');
      setEditTemplateDescription('');
      setEditTemplateCategory('');
      setEditTemplateItems([]);
      
      Alert.alert('Éxito', 'Template actualizado correctamente');
    } catch (error: any) {
      const errorMessage = error?.message || 'No se pudo actualizar el template';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleResponseForm = (form: FormTemplate) => {
    router.push({
      pathname: '/edit-response',
      params: {
        templateId: form.id,
        type: 'closed',
        templateTitle: form.title
      }
    } as any);
  };

  const handleDeleteForm = (form: FormTemplate) => {
    if (!form) return;
    
    Alert.alert(
      'Eliminar Template',
      `¿Estás seguro de que deseas eliminar "${form.title}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Guardar el ID antes de cerrar el menú
              const templateIdToDelete = form.id;
              
              // First, try to get all items for this template
              try {
                const items = await getItemsByTemplateId(templateIdToDelete);
                
                // Delete all items
                if (items && items.length > 0) {
                  for (const item of items) {
                    await deleteItem(item.id);
                  }
                }
              } catch (itemsError: any) {
                // If there are no items or error getting items, continue anyway
                // Continue with template deletion even if items deletion fails
              }
              
              // Then delete the template
              await deleteTemplate(templateIdToDelete);
              
              // Refresh templates list from database
              if (user?.id) {
                await getTemplatesByUserId(user.id, 1, 100);
              }
              
              Alert.alert('Éxito', 'Template eliminado correctamente');
            } catch (err: any) {
              const errorMessage = err.message || 'Error desconocido';
              Alert.alert('Error', `No se pudo eliminar el template: ${errorMessage}`);
            }
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Inspecciones Cerradas</Text>
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
                </View>

                <View style={styles.formCardFooter}>
                  <Text style={styles.formMeta}>
                    {form.itemCount} elementos
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* Botones de acción en esquina inferior derecha */}
              <TouchableOpacity 
                style={styles.responseButton}
                onPress={() => handleResponseForm(form)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.editButton,
                  form.user_id === 'ALL' && styles.disabledButton
                ]}
                onPress={() => {
                  if (form.user_id !== 'ALL') {
                    handleEditForm(form);
                  }
                }}
                disabled={form.user_id === 'ALL'}
              >
                <Ionicons 
                  name="create" 
                  size={20} 
                  color={form.user_id === 'ALL' ? '#9ca3af' : '#fff'} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.deleteButton,
                  form.user_id === 'ALL' && styles.disabledButton
                ]}
                onPress={() => {
                  if (form.user_id !== 'ALL') {
                    handleDeleteForm(form);
                  }
                }}
                disabled={form.user_id === 'ALL'}
              >
                <Ionicons 
                  name="trash" 
                  size={20} 
                  color={form.user_id === 'ALL' ? '#9ca3af' : '#fff'} 
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Espacio adicional para el bottom tab */}
        <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Modal de Crear Template */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.renameModalOverlay}>
          <View style={[styles.renameModalContent, {maxHeight: '90%', width: '95%'}]}>
            <Text style={styles.renameModalTitle}>Crear Nuevo Template</Text>
            
            <ScrollView style={{maxHeight: 500}} showsVerticalScrollIndicator={true}>
              <TextInput
                style={styles.renameInput}
                value={newTemplateTitle}
                onChangeText={setNewTemplateTitle}
                placeholder="Título del template"
              />
              
              <TextInput
                style={styles.renameInput}
                value={newTemplateCategory}
                onChangeText={setNewTemplateCategory}
                placeholder="Categoría"
              />
              
              <TextInput
                style={[styles.renameInput, {minHeight: 80}]}
                value={newTemplateDescription}
                onChangeText={setNewTemplateDescription}
                placeholder="Descripción"
                multiline={true}
              />
              
              <Text style={{fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8}}>Preguntas/Items:</Text>
              
              {newTemplateItems.map((item, index) => (
                <View key={index} style={{marginBottom: 12, backgroundColor: '#f9fafb', padding: 12, borderRadius: 8}}>
                  <Text style={{fontSize: 12, color: '#6b7280', marginBottom: 4}}>Item {index + 1}</Text>
                  <TextInput
                    style={[styles.renameInput, {marginBottom: 8}]}
                    value={item.category}
                    onChangeText={(value) => updateNewItem(index, 'category', value)}
                    placeholder="Categoría del item"
                  />
                  <Text style={{fontSize: 12, color: '#6b7280', marginBottom: 4, marginTop: 8}}>Tipo de pregunta</Text>
                  <View style={{flexDirection: 'row', marginBottom: 8, gap: 8}}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: item.question_type === 'text' ? '#6366f1' : '#e5e7eb',
                        alignItems: 'center'
                      }}
                      onPress={() => updateNewItem(index, 'question_type', 'text')}
                    >
                      <Text style={{color: item.question_type === 'text' ? '#fff' : '#374151', fontWeight: '600'}}>Texto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: item.question_type === 'single_choice' ? '#6366f1' : '#e5e7eb',
                        alignItems: 'center'
                      }}
                      onPress={() => updateNewItem(index, 'question_type', 'single_choice')}
                    >
                      <Text style={{color: item.question_type === 'single_choice' ? '#fff' : '#374151', fontWeight: '600'}}>Opción Única</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: item.question_type === 'multiple_choice' ? '#6366f1' : '#e5e7eb',
                        alignItems: 'center'
                      }}
                      onPress={() => updateNewItem(index, 'question_type', 'multiple_choice')}
                    >
                      <Text style={{color: item.question_type === 'multiple_choice' ? '#fff' : '#374151', fontWeight: '600'}}>Múltiple</Text>
                    </TouchableOpacity>
                  </View>
                  {(item.question_type === 'single_choice' || item.question_type === 'multiple_choice') && (
                    <View style={{marginBottom: 8}}>
                      <Text style={{fontSize: 12, color: '#6b7280', marginBottom: 4}}>Opciones</Text>
                      {item.options.map((option, optIndex) => (
                        <View key={optIndex} style={{flexDirection: 'row', marginBottom: 4, alignItems: 'center'}}>
                          <TextInput
                            style={[styles.renameInput, {flex: 1, marginBottom: 0}]}
                            value={option}
                            onChangeText={(value) => updateNewItemOption(index, optIndex, value)}
                            placeholder={`Opción ${optIndex + 1}`}
                          />
                          {item.options.length > 2 && (
                            <TouchableOpacity
                              style={{marginLeft: 8, padding: 8}}
                              onPress={() => removeNewItemOption(index, optIndex)}
                            >
                              <Ionicons name="close-circle" size={20} color="#ef4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity
                        style={{alignSelf: 'flex-start', marginTop: 4}}
                        onPress={() => addNewItemOption(index)}
                      >
                        <Text style={{color: '#6366f1', fontSize: 12}}>+ Agregar opción</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <TextInput
                    style={[styles.renameInput, {minHeight: 60, marginTop: 8}]}
                    value={item.text}
                    onChangeText={(value) => updateNewItem(index, 'text', value)}
                    placeholder="Texto de la pregunta"
                    multiline={true}
                  />
                  {newTemplateItems.length > 1 && (
                    <TouchableOpacity 
                      style={{alignSelf: 'flex-end', marginTop: 8}}
                      onPress={() => removeNewItem(index)}
                    >
                      <Text style={{color: '#ef4444', fontSize: 14}}>Eliminar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity 
                style={{backgroundColor: '#e5e7eb', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16}}
                onPress={addNewItem}
              >
                <Text style={{color: '#374151', fontWeight: '600'}}>+ Agregar Item</Text>
              </TouchableOpacity>
            </ScrollView>
            
            <View style={styles.renameModalButtons}>
              <TouchableOpacity 
                style={styles.renameCancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewTemplateTitle('');
                  setNewTemplateDescription('');
                  setNewTemplateCategory('');
                  setNewTemplateItems([{text: '', category: '', question_type: 'text', options: []}]);
                }}
              >
                <Text style={styles.renameCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.renameConfirmButton, isCreatingTemplate && styles.renameConfirmButtonDisabled]}
                onPress={handleCreateTemplate}
                disabled={isCreatingTemplate}
              >
                <Text style={styles.renameConfirmText}>{isCreatingTemplate ? 'Creando...' : 'Crear'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Items del Template */}
      <Modal
        visible={showItemsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowItemsModal(false)}
      >
        <View 
          style={styles.itemsModalOverlay}
        >
          <TouchableOpacity 
            style={styles.itemsModalOverlayTouchable}
            activeOpacity={1}
            onPress={() => {
              setShowItemsModal(false);
              setShowCategoryDropdown(false);
            }}
          />
          <View 
            style={styles.itemsModalContent}
          >
            {/* Header del Modal */}
            <View style={styles.itemsModalHeader}>
              <Text style={styles.itemsModalTitle}>Inspeccion</Text>
              <TouchableOpacity 
                style={styles.itemsModalCloseButton}
                onPress={() => {
                  setShowItemsModal(false);
                  setShowCategoryDropdown(false);
                }}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            </View>

            {/* Selector de Categoría */}
            {selectedTemplateItems.length > 0 && (
              <View style={styles.itemsCategorySelectorContainer}>
                <TouchableOpacity
                  style={styles.itemsCategorySelector}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <Ionicons name="folder" size={20} color="#6366f1" />
                  <Text style={styles.itemsCategorySelectorText}>
                    {selectedCategoryInModal || 'Seleccionar categoría'}
                  </Text>
                  <Ionicons 
                    name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>

                {/* Dropdown de Categorías */}
                {showCategoryDropdown && (
                  <ScrollView 
                    style={styles.itemsCategoryDropdown}
                    nestedScrollEnabled={true}
                  >
                    {selectedTemplateItems.map((categoryGroup, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.itemsCategoryDropdownItem,
                          selectedCategoryInModal === categoryGroup.category && styles.itemsCategoryDropdownItemActive
                        ]}
                        onPress={() => {
                          setSelectedCategoryInModal(categoryGroup.category);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.itemsCategoryDropdownItemText,
                          selectedCategoryInModal === categoryGroup.category && styles.itemsCategoryDropdownItemTextActive
                        ]}>
                          {categoryGroup.category}
                        </Text>
                        <View style={styles.itemsCategoryBadge}>
                          <Text style={styles.itemsCategoryBadgeText}>
                            {categoryGroup.items.length}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            <ScrollView 
              style={styles.itemsModalScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.itemsModalScrollContent}
              nestedScrollEnabled={true}
              bounces={true}
              scrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              onStartShouldSetResponder={() => false}
              onMoveShouldSetResponder={() => false}
            >
              {selectedTemplateItems.length > 0 && selectedCategoryInModal ? (
                (() => {
                  const selectedCategoryGroup = selectedTemplateItems.find(
                    group => group.category === selectedCategoryInModal
                  );
                  return selectedCategoryGroup ? (
                    <View style={styles.itemsListContainer}>
                      {selectedCategoryGroup.items.map((item: any, itemIdx: number) => (
                        <View key={itemIdx} style={styles.itemsQuestionCard}>
                          {item.question_index && (
                            <View style={styles.itemsQuestionHeader}>
                              <View style={styles.itemsQuestionIndex}>
                                <Text style={styles.itemsQuestionIndexText}>
                                  {item.question_index}
                                </Text>
                              </View>
                            </View>
                          )}
                          <Text style={styles.itemsQuestionText}>
                            {item.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null;
                })()
              ) : (
                <View style={styles.itemsEmptyContainer}>
                  <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                  <Text style={styles.itemsEmptyText}>
                    {selectedTemplateItems.length === 0 
                      ? 'Este template no tiene preguntas asignadas aún.'
                      : 'Selecciona una categoría para ver las preguntas.'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Editar Template */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.renameModalOverlay}>
          <View style={[styles.renameModalContent, {maxHeight: '90%', width: '95%'}]}>
            <Text style={styles.renameModalTitle}>Editar Template</Text>
            
            <ScrollView style={{maxHeight: 500}} showsVerticalScrollIndicator={true}>
              <TextInput
                style={styles.renameInput}
                value={editTemplateTitle}
                onChangeText={setEditTemplateTitle}
                placeholder="Título del template"
              />
              
              <TextInput
                style={styles.renameInput}
                value={editTemplateCategory}
                onChangeText={setEditTemplateCategory}
                placeholder="Categoría"
              />
              
              <TextInput
                style={[styles.renameInput, {minHeight: 80}]}
                value={editTemplateDescription}
                onChangeText={setEditTemplateDescription}
                placeholder="Descripción"
                multiline={true}
              />
              
              <Text style={{fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8}}>Preguntas/Items:</Text>
              
              {editTemplateItems.map((item, index) => (
                <View key={index} style={{marginBottom: 12, backgroundColor: '#f9fafb', padding: 12, borderRadius: 8}}>
                  <Text style={{fontSize: 12, color: '#6b7280', marginBottom: 4}}>Item {index + 1}</Text>
                  <TextInput
                    style={[styles.renameInput, {marginBottom: 8}]}
                    value={item.category}
                    onChangeText={(value) => updateEditItem(index, 'category', value)}
                    placeholder="Categoría del item"
                  />
                  <Text style={{fontSize: 12, color: '#6b7280', marginBottom: 4, marginTop: 8}}>Tipo de pregunta</Text>
                  <View style={{flexDirection: 'row', marginBottom: 8, gap: 8}}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: (item.question_type || 'text') === 'text' ? '#6366f1' : '#e5e7eb',
                        alignItems: 'center'
                      }}
                      onPress={() => updateEditItem(index, 'question_type', 'text')}
                    >
                      <Text style={{color: (item.question_type || 'text') === 'text' ? '#fff' : '#374151', fontWeight: '600'}}>Texto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: item.question_type === 'single_choice' ? '#6366f1' : '#e5e7eb',
                        alignItems: 'center'
                      }}
                      onPress={() => updateEditItem(index, 'question_type', 'single_choice')}
                    >
                      <Text style={{color: item.question_type === 'single_choice' ? '#fff' : '#374151', fontWeight: '600'}}>Opción Única</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: item.question_type === 'multiple_choice' ? '#6366f1' : '#e5e7eb',
                        alignItems: 'center'
                      }}
                      onPress={() => updateEditItem(index, 'question_type', 'multiple_choice')}
                    >
                      <Text style={{color: item.question_type === 'multiple_choice' ? '#fff' : '#374151', fontWeight: '600'}}>Múltiple</Text>
                    </TouchableOpacity>
                  </View>
                  {(item.question_type === 'single_choice' || item.question_type === 'multiple_choice') && (
                    <View style={{marginBottom: 8}}>
                      <Text style={{fontSize: 12, color: '#6b7280', marginBottom: 4}}>Opciones</Text>
                      {(item.options || []).map((option, optIndex) => (
                        <View key={optIndex} style={{flexDirection: 'row', marginBottom: 4, alignItems: 'center'}}>
                          <TextInput
                            style={[styles.renameInput, {flex: 1, marginBottom: 0}]}
                            value={option}
                            onChangeText={(value) => updateEditItemOption(index, optIndex, value)}
                            placeholder={`Opción ${optIndex + 1}`}
                          />
                          {(item.options || []).length > 2 && (
                            <TouchableOpacity
                              style={{marginLeft: 8, padding: 8}}
                              onPress={() => removeEditItemOption(index, optIndex)}
                            >
                              <Ionicons name="close-circle" size={20} color="#ef4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity
                        style={{alignSelf: 'flex-start', marginTop: 4}}
                        onPress={() => addEditItemOption(index)}
                      >
                        <Text style={{color: '#6366f1', fontSize: 12}}>+ Agregar opción</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <TextInput
                    style={[styles.renameInput, {minHeight: 60, marginTop: 8}]}
                    value={item.text}
                    onChangeText={(value) => updateEditItem(index, 'text', value)}
                    placeholder="Texto de la pregunta"
                    multiline={true}
                  />
                  {editTemplateItems.length > 1 && (
                    <TouchableOpacity 
                      style={{alignSelf: 'flex-end', marginTop: 8}}
                      onPress={() => removeEditItem(index)}
                    >
                      <Text style={{color: '#ef4444', fontSize: 14}}>Eliminar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity 
                style={{backgroundColor: '#e5e7eb', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16}}
                onPress={addEditItem}
              >
                <Text style={{color: '#374151', fontWeight: '600'}}>+ Agregar Item</Text>
              </TouchableOpacity>
            </ScrollView>
            
            <View style={styles.renameModalButtons}>
              <TouchableOpacity 
                style={styles.renameCancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                  setEditTemplateTitle('');
                  setEditTemplateDescription('');
                  setEditTemplateCategory('');
                  setEditTemplateItems([]);
                }}
              >
                <Text style={styles.renameCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.renameConfirmButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.renameConfirmText}>Guardar Cambios</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
  // Estilos para el botón de responder
  responseButton: {
    position: 'absolute',
    bottom: 12,
    right: 96,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
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
    zIndex: 10,
  },
  // Estilos para el botón de editar
  editButton: {
    position: 'absolute',
    bottom: 12,
    right: 54,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
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
    zIndex: 10,
  },
  // Estilos para el botón de eliminar
  deleteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ef4444',
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
    zIndex: 10,
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
    opacity: 0.6,
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
  renameConfirmButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  renameConfirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  // Estilos para el modal de items mejorado
  itemsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  itemsModalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  itemsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '95%',
    maxWidth: 600,
    height: '85%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  itemsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  itemsModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  itemsModalCloseButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  itemsCategorySelectorContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    position: 'relative',
    zIndex: 100,
  },
  itemsCategorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemsCategorySelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 10,
  },
  itemsCategoryDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 4,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  itemsCategoryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemsCategoryDropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  itemsCategoryDropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  itemsCategoryDropdownItemTextActive: {
    color: '#6366f1',
    fontWeight: '700',
  },
  itemsModalScrollView: {
    flex: 1,
    flexGrow: 1,
  },
  itemsModalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  itemsCategoryContainer: {
    marginBottom: 32,
  },
  itemsCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  itemsCategoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  itemsCategoryBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemsCategoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  itemsListContainer: {
    // gap no funciona en React Native, usamos marginBottom en cada card
  },
  itemsQuestionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemsQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  itemsQuestionIndex: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemsQuestionIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  itemsQuestionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsQuestionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  itemsQuestionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 26,
    fontWeight: '500',
    marginTop: 4,
  },
  itemsEmptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsEmptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
});



