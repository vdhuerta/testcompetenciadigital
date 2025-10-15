import React, { useState, useCallback, useEffect } from 'react';
import { COUNTRIES, UNIVERSITIES_CHILE } from '../constants';
import type { UserData } from '../types';

interface OnboardingProps {
  onComplete: (data: UserData) => void;
  currentUserData?: UserData | null;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, currentUserData }) => {
  const [country, setCountry] = useState<string>(currentUserData?.country || 'Chile');
  const [university, setUniversity] = useState<string>(currentUserData?.university || '');
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    if (currentUserData) {
      setCountry(currentUserData.country);
      setUniversity(currentUserData.university);
    }
  }, [currentUserData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (country === 'Chile' && !university) {
      setError('Por favor, selecciona tu universidad.');
      return;
    }
    setError('');
    onComplete({ country, university });
  }, [country, university, onComplete]);

  const welcomeText = "Te damos la bienvenida a esta herramienta de autoevaluación, inspirada en los marcos DigCompEdu y OpenEdu. A través de 24 preguntas, podrás reflexionar sobre tu práctica docente en siete áreas clave.\n\nEl objetivo es apoyarte en el uso de herramientas digitales para innovar en tu enseñanza. Para cada pregunta, encontrarás seis niveles de habilidad. Por favor, selecciona la opción que mejor describa tu situación actual. ¡Comencemos a potenciar juntos tu desarrollo profesional!";


  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col items-center text-center">
            <img 
                src="https://raw.githubusercontent.com/vdhuerta/assets-aplications/main/Caramello_en_recorte.png" 
                alt="Ilustración decorativa" 
                className="h-40 w-auto mb-4"
            />
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Autoevaluación Docente
          </h2>
          <p className="mt-4 text-sm text-slate-600 whitespace-pre-line">
            {currentUserData ? 'Aquí puedes actualizar tu información de perfil.' : welcomeText}
          </p>
        </div>
        <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1 text-left">
                País
              </label>
              <select
                id="country"
                name="country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setUniversity('');
                  setError('');
                }}
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {country === 'Chile' && (
              <div>
                <label htmlFor="university" className="block text-sm font-medium text-slate-700 mb-1 text-left">
                  Universidad (Chile)
                </label>
                <select
                  id="university"
                  name="university"
                  value={university}
                  onChange={(e) => {
                    setUniversity(e.target.value);
                    setError('');
                  }}
                  className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  required
                >
                  <option value="" disabled>Selecciona una universidad</option>
                  {UNIVERSITIES_CHILE.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
              {currentUserData ? 'Guardar Cambios' : 'Comenzar Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};