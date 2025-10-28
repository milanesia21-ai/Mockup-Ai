import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { DisplayArea } from './components/DisplayArea';
import { EditorPanel } from './components/EditorPanel';
import { generateMockup, generateGraphic, editImage } from './services/geminiService';
import { GARMENT_CATEGORIES, DESIGN_STYLE_CATEGORIES, StyleOption, AspectRatioOption } from './constants';

type View = 'generator' | 'editor';

const App: React.FC = () => {
  const [view, setView] = useState<View>('generator');
  const [selectedCategory, setSelectedCategory] = useState<string>(GARMENT_CATEGORIES[0].name);
  const [selectedGarment, setSelectedGarment] = useState<string>(GARMENT_CATEGORIES[0].items[0]);
  const [selectedDesignStyle, setSelectedDesignStyle] = useState<string>(DESIGN_STYLE_CATEGORIES[0].items[0]);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>('Photorealistic Mockup');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatioOption>('1:1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [graphic, setGraphic] = useState<string | null>(null);
  const [graphicPosition, setGraphicPosition] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.25 }); // Percentage-based

  const garmentItems = useMemo(() => {
    const category = GARMENT_CATEGORIES.find(cat => cat.name === selectedCategory);
    return category ? category.items : [];
  }, [selectedCategory]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    const newItems = GARMENT_CATEGORIES.find(cat => cat.name === category)?.items || [];
    setSelectedGarment(newItems[0] || '');
  }, []);

  const handleGenerateMockup = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage('Generating Your Masterpiece...');
    setError(null);
    setGeneratedImage(null);
    setGraphic(null);

    try {
      const imageDataUrl = await generateMockup(selectedGarment, selectedStyle, selectedAspectRatio, selectedDesignStyle);
      setGeneratedImage(imageDataUrl);
      setView('editor'); // Switch to editor after successful generation
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGarment, selectedStyle, selectedAspectRatio, selectedDesignStyle]);
  
  const handleGenerateGraphic = useCallback(async (prompt: string) => {
    if (!prompt) {
      setError("Please enter a prompt for the graphic.");
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Creating Your Custom Graphic...');
    setError(null);
    try {
      const graphicDataUrl = await generateGraphic(prompt, selectedGarment);
      setGraphic(graphicDataUrl);
      setGraphicPosition({ x: 0.5, y: 0.25 }); // Reset position
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred creating the graphic.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGarment]);

  const handleEditImage = useCallback(async (prompt: string) => {
    if (!prompt) {
      setError("Please enter a prompt to edit the image.");
      return;
    }
    if (!generatedImage) {
      setError("Please generate a mockup first before editing.");
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Applying Your Edits...');
    setError(null);
    try {
      // Create a composite image on a canvas if a graphic exists
      let imageToEdit = generatedImage;
      if (graphic) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const baseImg = new Image();
          baseImg.src = generatedImage;
          await new Promise(resolve => { baseImg.onload = resolve; });
          
          canvas.width = baseImg.width;
          canvas.height = baseImg.height;
          ctx!.drawImage(baseImg, 0, 0);

          const graphicImg = new Image();
          graphicImg.src = graphic;
          await new Promise(resolve => { graphicImg.onload = resolve; });
          
          const targetWidth = canvas.width * 0.3; // Example size: 30% of mockup width
          const targetHeight = (graphicImg.height / graphicImg.width) * targetWidth;
          const targetX = (graphicPosition.x * canvas.width) - (targetWidth / 2);
          const targetY = (graphicPosition.y * canvas.height) - (targetHeight / 2);
          ctx!.drawImage(graphicImg, targetX, targetY, targetWidth, targetHeight);
          imageToEdit = canvas.toDataURL('image/png');
      }

      const editedImageDataUrl = await editImage(imageToEdit, prompt);
      setGeneratedImage(editedImageDataUrl);
      setGraphic(null); // Clear graphic after merging it into the base image
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while editing the image.');
    } finally {
      setIsLoading(false);
    }
  }, [generatedImage, graphic, graphicPosition]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
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
               />
            )}
          </div>
        </div>
        <div className="flex-grow lg:w-2/3 xl:w-3/4">
          <DisplayArea
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            error={error}
            generatedImage={generatedImage}
            graphic={graphic}
            onGraphicPositionChange={setGraphicPosition}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
