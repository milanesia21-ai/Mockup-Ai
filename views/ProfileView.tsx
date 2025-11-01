

import React, { useState, useContext, useRef } from 'react';
import { AuthContext, User } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

interface ProfileViewProps {
  setView: (view: 'mockup' | 'profile' | 'settings') => void;
}

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
);

export const ProfileView: React.FC<ProfileViewProps> = ({ setView }) => {
  const { user, updateProfile, logout, deleteAccount } = useContext(AuthContext);
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return null; // Non dovrebbe accadere se la vista viene renderizzata
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
       <button onClick={() => setView('mockup')} className="mb-6 text-sm text-orange-500 hover:underline">
        &larr; {t('profile.backToGenerator')}
      </button>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                        <img src={user.avatar} alt={t('profile.userAvatarAlt')} className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-20 h-20 text-gray-500 dark:text-gray-400" />
                    )}
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-orange-600 text-white rounded-full p-2 hover:bg-orange-700"
                    aria-label={t('profile.changeAvatar')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
            </div>

            <div className="flex-grow w-full">
                {isEditing ? (
                    <div className="space-y-4">
                        <input
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleInputChange}
                            placeholder={t('profile.displayName')}
                            className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2"
                        />
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            placeholder={t('profile.bio')}
                            rows={3}
                            className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 resize-none"
                        />
                    </div>
                ) : (
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{user.displayName || t('profile.defaultUserName')}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                        <p className="mt-2 text-gray-700 dark:text-gray-300">{user.bio || t('profile.noBio')}</p>
                    </div>
                )}
            </div>
             <div className="flex-shrink-0">
                {isEditing ? (
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">{t('profile.save')}</button>
                        <button onClick={() => setIsEditing(false)} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-md">{t('profile.cancel')}</button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">{t('profile.editProfile')}</button>
                )}
            </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8">
            <h3 className="text-xl font-semibold mb-4">{t('profile.accountManagement.title')}</h3>
            <div className="space-y-4 max-w-sm">
                <button onClick={() => alert('Il cambio password non è implementato in questa demo.')} className="w-full text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-3 rounded-md">{t('profile.accountManagement.changePassword')}</button>
                <button onClick={logout} className="w-full text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-3 rounded-md">{t('profile.accountManagement.logout')}</button>
                 <button onClick={deleteAccount} className="w-full text-left bg-red-500/10 text-red-500 hover:bg-red-500/20 p-3 rounded-md font-semibold">{t('profile.accountManagement.deleteAccount')}</button>
            </div>
        </div>
      </div>
    </div>
  );
};
