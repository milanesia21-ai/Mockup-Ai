import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { DisplayArea } from './components/DisplayArea';
import { EditorPanel } from './components/EditorPanel';
import { 
  generateMockup, 
  generateGraphic, 
  editImage,
  checkContrast,
  generateGraphicVariation,
  reversePromptFromImage,
  runPrintSafetyCheck
} from './services/geminiService';
import { 
  GARMENT_CATEGORIES, 
  DESIGN_STYLE_CATEGORIES, 
  MATERIALS_BY_GARMENT_TYPE, 
  GARMENT_COLORS, 
  TARGET_AREAS,
  FINISH_SIMULATIONS,
  StyleOption, 
  AspectRatioOption 
} from './constants';

type View = 'generator' | 'editor';

const App: React.FC = () => {
  const [view, setView] = useState<View>('generator');
  const [selectedCategory, setSelectedCategory] = useState<string>(GARMENT_CATEGORIES[0].name);
  const [selectedGarment, setSelectedGarment] = useState<string>(GARMENT_CATEGORIES[0].items[0]);
  const [selectedDesignStyle, setSelectedDesignStyle] = useState<string>(DESIGN_STYLE_CATEGORIES[0].items[0]);
  const [selectedColor, setSelectedColor] = useState<string>(GARMENT_COLORS[0]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>('Photorealistic Mockup');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatioOption>('1:1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [graphic, setGraphic] = useState<string | null>(null);
  const [graphicPrompt, setGraphicPrompt] = useState<string>('');

  // Graphic transformations
  const [graphicPosition, setGraphicPosition] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.25 });
  const [graphicSize, setGraphicSize] = useState<number>(0.3);
  const [graphicRotation, setGraphicRotation] = useState<number>(0);
  const [graphicFlip, setGraphicFlip] = useState<{ horizontal: boolean, vertical: boolean }>({ horizontal: false, vertical: false });

  // New Advanced AI Features State
  const [targetArea, setTargetArea] = useState<string>(TARGET_AREAS[0]);
  const [finishSimulation, setFinishSimulation] = useState<string>(FINISH_SIMULATIONS[0]);
  const [smartDisplacement, setSmartDisplacement] = useState<boolean>(false);


  const garmentItems = useMemo(() => {
    const category = GARMENT_CATEGORIES.find(cat => cat.name === selectedCategory);
    return category ? category.items : [];
  }, [selectedCategory]);

  const materialOptions = useMemo(() => {
    return MATERIALS_BY_GARMENT_TYPE[selectedCategory] || [];
  }, [selectedCategory]);

  useEffect(() => {
    if (materialOptions.length > 0 && !materialOptions.includes(selectedMaterial)) {
      setSelectedMaterial(materialOptions[0]);
    } else if (materialOptions.length === 0) {
      setSelectedMaterial('');
    }
  }, [materialOptions, selectedMaterial]);


  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    const newItems = GARMENT_CATEGORIES.find(cat => cat.name === category)?.items || [];
    setSelectedGarment(newItems[0] || '');
  }, []);

  const handleGenerateMockup = useCallback(async () => {
    setIsLoading(true);
    const promise = generateMockup(
      selectedGarment, 
      selectedStyle, 
      selectedAspectRatio, 
      selectedDesignStyle,
      selectedColor,
      selectedMaterial
    );

    toast.promise(promise, {
      loading: 'Generating your masterpiece...',
      success: (imageDataUrl) => {
        setGeneratedImage(imageDataUrl);
        setGraphic(null);
        setView('editor');
        return 'Mockup generated successfully!';
      },
      error: (err) => err instanceof Error ? err.message : 'An unknown error occurred.',
    });
    
    promise.catch(() => {}).finally(() => setIsLoading(false));
  }, [selectedGarment, selectedStyle, selectedAspectRatio, selectedDesignStyle, selectedColor, selectedMaterial]);
  
  const handleGenerateGraphic = useCallback(async (prompt: string) => {
    if (!prompt) {
      toast.error("Please enter a prompt for the graphic.");
      return;
    }
    
    setIsLoading(true);
    setGraphicPrompt(prompt); // Save the prompt
    const promise = generateGraphic(prompt, selectedGarment, targetArea);
    
    toast.promise(promise, {
      loading: 'Creating your custom graphic...',
      success: (graphicDataUrl) => {
        setGraphic(graphicDataUrl);
        // Reset all graphic transformations
        setGraphicPosition({ x: 0.5, y: 0.25 }); 
        setGraphicSize(0.3);
        setGraphicRotation(0);
        setGraphicFlip({ horizontal: false, vertical: false });
        return 'Custom graphic created!';
      },
      error: (err) => err instanceof Error ? err.message : 'An error occurred creating the graphic.',
    });

    promise.catch(() => {}).finally(() => setIsLoading(false));
  }, [selectedGarment, targetArea]);

  const handleEditImage = useCallback(async (prompt: string) => {
    if (!prompt) {
      toast.error("Please enter a prompt to edit the image.");
      return;
    }
    if (!generatedImage) {
      toast.error("Please generate a mockup first before editing.");
      return;
    }
    setIsLoading(true);
    
    const promise = (async () => {
      let imageToEdit = generatedImage;
      if (graphic) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error("Could not get canvas context");

          const baseImg = new Image();
          baseImg.src = generatedImage;
          await new Promise(resolve => { baseImg.onload = resolve; });
          
          canvas.width = baseImg.width;
          canvas.height = baseImg.height;
          ctx.drawImage(baseImg, 0, 0);

          const graphicImg = new Image();
          graphicImg.src = graphic;
          await new Promise(resolve => { graphicImg.onload = resolve; });
          
          const targetWidth = canvas.width * graphicSize;
          const targetHeight = (graphicImg.height / graphicImg.width) * targetWidth;
          const targetX = (graphicPosition.x * canvas.width) - (targetWidth / 2);
          const targetY = (graphicPosition.y * canvas.height) - (targetHeight / 2);
          
          ctx.save();
          ctx.translate(targetX + targetWidth / 2, targetY + targetHeight / 2);
          ctx.rotate(graphicRotation * Math.PI / 180);
          ctx.scale(graphicFlip.horizontal ? -1 : 1, graphicFlip.vertical ? -1 : 1);
          ctx.drawImage(graphicImg, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
          ctx.restore();

          imageToEdit = canvas.toDataURL('image/png');
      }

      return await editImage(imageToEdit, prompt);
    })();

    toast.promise(promise, {
      loading: 'Applying your edits...',
      success: (editedImageDataUrl) => {
        setGeneratedImage(editedImageDataUrl);
        setGraphic(null); // Clear graphic after merging it into the base image
        return 'Image edited successfully!';
      },
      error: (err) => err instanceof Error ? err.message : 'An unknown error occurred while editing the image.',
    });

    promise.catch(() => {}).finally(() => setIsLoading(false));
  }, [generatedImage, graphic, graphicPosition, graphicSize, graphicRotation, graphicFlip]);
  
  // --- REAL HANDLERS FOR ADVANCED AI FEATURES ---
  
  const handleCheckContrast = useCallback(() => {
    if (!graphic || !generatedImage) return;
    const promise = checkContrast(generatedImage, graphic, selectedColor).then(analysis => {
      toast.info(analysis, { duration: 10000 });
      return analysis;
    });
    toast.promise(promise, {
        loading: 'AI is checking color contrast...',
        success: 'Contrast analysis complete!',
        error: (err) => err instanceof Error ? err.message : 'An error occurred.',
    });
  }, [generatedImage, graphic, selectedColor]);

  const handleGenerateVariation = useCallback(() => {
    if (!graphicPrompt) {
      toast.error('Generate a graphic first to create a variation.');
      return;
    }
    const promise = generateGraphicVariation(graphicPrompt, selectedGarment, targetArea);
    toast.promise(promise, {
        loading: 'Generating a new variation...',
        success: (newGraphicUrl) => {
            setGraphic(newGraphicUrl);
            return 'New graphic variation created!';
        },
        error: (err) => err instanceof Error ? err.message : 'An error occurred.',
    });
  }, [graphicPrompt, selectedGarment, targetArea]);
  
  const handleReversePrompt = useCallback((imageDataUrl: string) => {
    const promise = reversePromptFromImage(imageDataUrl).then(prompt => {
      setGraphicPrompt(prompt);
      toast.success('Prompt generated from image!');
      return prompt;
    });
    toast.promise(promise, {
      loading: 'AI is analyzing your image...',
      success: 'Prompt generated successfully!',
      error: (err) => err instanceof Error ? err.message : 'An error occurred.',
    });
  }, []);
  
  const handlePrintSafetyCheck = useCallback(() => {
    if (!graphic) return;
    const promise = runPrintSafetyCheck(graphic).then(analysis => {
      toast.info(analysis, { duration: 10000 });
      return analysis;
    });
    toast.promise(promise, {
      loading: 'AI is checking for print safety...',
      success: 'Print safety check complete!',
      error: (err) => err instanceof Error ? err.message : 'An error occurred.',
    });
  }, [graphic]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Toaster position="top-right" richColors theme="dark" />
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 xl:w-1/4 flex-shrink-0">
          <div className="bg-gray-800 p-6 rounded-lg shadow-2xl h-full flex flex-col">
            <div className="flex border-b border-gray-700 mb-6">
              <button onClick={() => setView('generator')} className={`py-2 px-4 text-sm font-medium ${view === 'generator' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                1. Mockup Generator
              </button>
              <button onClick={() => setView('editor')} disabled={!generatedImage} className={`py-2 px-4 text-sm font-medium ${view === 'editor' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                2. Graphic Editor
              </button>
            </div>
            
            {view === 'generator' && (
              <ControlPanel
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                garmentItems={garmentItems}
                selectedGarment={selectedGarment}
                onGarmentChange={setSelectedGarment}
                selectedDesignStyle={selectedDesignStyle}
                onDesignStyleChange={setSelectedDesignStyle}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                materialOptions={materialOptions}
                selectedMaterial={selectedMaterial}
                onMaterialChange={setSelectedMaterial}
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
                selectedAspectRatio={selectedAspectRatio}
                onAspectRatioChange={setSelectedAspectRatio}
                onGenerate={handleGenerateMockup}
                isLoading={isLoading}
              />
            )}
            {view === 'editor' && generatedImage && (
               <EditorPanel
                onGenerateGraphic={handleGenerateGraphic}
                onEditImage={handleEditImage}
                isLoading={isLoading}
                hasGraphic={!!graphic}
                graphicPrompt={graphicPrompt}
                onGraphicPromptChange={setGraphicPrompt}
                graphicRotation={graphicRotation}
                onGraphicRotationChange={setGraphicRotation}
                graphicFlip={graphicFlip}
                onGraphicFlipChange={setGraphicFlip}
                // Pass new state and handlers
                targetArea={targetArea}
                onTargetAreaChange={setTargetArea}
                finishSimulation={finishSimulation}
                onFinishSimulationChange={setFinishSimulation}
                smartDisplacement={smartDisplacement}
                onSmartDisplacementChange={setSmartDisplacement}
                onCheckContrast={handleCheckContrast}
                onGenerateVariation={handleGenerateVariation}
                onReversePrompt={handleReversePrompt}
                onPrintSafetyCheck={handlePrintSafetyCheck}
               />
            )}
          </div>
        </div>
        <div className="flex-grow lg:w-2/3 xl:w-3/4">
          <DisplayArea
            generatedImage={generatedImage}
            graphic={graphic}
            graphicPosition={graphicPosition}
            onGraphicPositionChange={setGraphicPosition}
            graphicSize={graphicSize}
            onGraphicSizeChange={setGraphicSize}
            graphicRotation={graphicRotation}
            graphicFlip={graphicFlip}
            finishSimulation={finishSimulation}
            smartDisplacement={smartDisplacement}
          />
        </div>
      </main>
    </div>
  );
};

export default App;