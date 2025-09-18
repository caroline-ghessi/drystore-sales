import React from 'react';
import { AssetGallery } from '../components/assets/AssetGallery';

export const TemplateAssetsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <AssetGallery />
    </div>
  );
};