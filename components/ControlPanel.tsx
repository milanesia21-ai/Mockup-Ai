import React from 'react';
import { GARMENT_CATEGORIES, STYLE_OPTIONS, ASPECT_RATIO_OPTIONS, DESIGN_STYLE_CATEGORIES, GARMENT_COLORS, StyleOption, AspectRatioOption } from '../constants';

interface ControlPanelProps {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  garmentItems: string[];
  selectedGarment: string;
  onGarmentChange: (value: string) => void;
  selectedDesignStyle: string;
  onDesignStyleChange: (value: string) => void;
  selectedColor: string;
  onColorChange: (value: string) => void;
  materialOptions: string[];
  selectedMaterial: string;
  onMaterialChange: (value: string) => void;
  selectedStyle: StyleOption;
  onStyleChange: (value: StyleOption) => void;
  selectedAspectRatio: AspectRatioOption;
  onAspectRatioChange: (value: AspectRatioOption) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const SelectInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  id: string;
  disabled?: boolean;
}> = ({ label, value, onChange, options, id, disabled = false }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);


const RadioGroup: React.FC<{
  label: string;
  selectedValue: string;
  onChange: (value: any) => void;
  options: { value: string; label: string }[];
}> = ({ label, selectedValue, onChange, options }) => (
  <fieldset className="mb-4">
    <legend className="block text-sm font-medium text-gray-300 mb-2">{label}</legend>
    <div className="space-y-2">
      {options.map(option => (
        <div key={option.value} className="flex items-center">
          <input
            id={option.value}
            name={label}
            type="radio"
            value={option.value}
            checked={selectedValue === option.value}
            onChange={() => onChange(option.value)}
            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-500 bg-gray-700"
          />
          <label htmlFor={option.value} className="ml-3 block text-sm font-medium text-gray-300">{option.label}</label>
        </div>
      ))}
    </div>
  </fieldset>
);


export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedCategory,
  onCategoryChange,
  garmentItems,
  selectedGarment,
  onGarmentChange,
  selectedDesignStyle,
  onDesignStyleChange,
  selectedColor,
  onColorChange,
  materialOptions,
  selectedMaterial,
  onMaterialChange,
  selectedStyle,
  onStyleChange,
  selectedAspectRatio,
  onAspectRatioChange,
  onGenerate,
  isLoading
}) => {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-white">Customize Your Mockup</h2>
      
      <div className="flex-grow">
        <SelectInput
          id="garment-category"
          label="A. Select Garment Category"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          options={GARMENT_CATEGORIES.map(cat => ({ value: cat.name, label: cat.name }))}
        />

        <SelectInput
          id="garment-item"
          label="B. Select Garment"
          value={selectedGarment}
          onChange={(e) => onGarmentChange(e.target.value)}
          options={garmentItems.map(item => ({ value: item, label: item }))}
        />
        
        <div className="mb-4">
          <label htmlFor="design-style" className="block text-sm font-medium text-gray-300 mb-1">C. Select Design Style</label>
          <select
            id="design-style"
            value={selectedDesignStyle}
            onChange={(e) => onDesignStyleChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white"
          >
            {DESIGN_STYLE_CATEGORIES.map(category => (
              <optgroup key={category.name} label={category.name}>
                {category.items.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <SelectInput
          id="garment-color"
          label="D. Select Color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          options={GARMENT_COLORS.map(color => ({ value: color, label: color }))}
        />

        <SelectInput
          id="garment-material"
          label="E. Select Material"
          value={selectedMaterial}
          onChange={(e) => onMaterialChange(e.target.value)}
          options={materialOptions.map(material => ({ value: material, label: material }))}
          disabled={materialOptions.length === 0}
        />
        
        <RadioGroup
          label="F. Select Mockup Style"
          selectedValue={selectedStyle}
          onChange={onStyleChange}
          options={STYLE_OPTIONS.map(style => ({ value: style, label: style }))}
        />

        <SelectInput
          id="aspect-ratio"
          label="G. Select Aspect Ratio"
          value={selectedAspectRatio}
          onChange={(e) => onAspectRatioChange(e.target.value as AspectRatioOption)}
          options={ASPECT_RATIO_OPTIONS.map(ratio => ({ value: ratio, label: ratio }))}
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </div>
        ) : 'Generate Mockup'}
      </button>
    </div>
  );
};