import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PenTool, Check, X, RotateCcw } from 'lucide-react';

function SignaturePage() {
  const { trainingId, participantId } = useParams<{ trainingId: string; participantId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [training, setTraining] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trainingId && participantId) {
      fetchData();
    }
  }, [trainingId, participantId]);

  const fetchData = async () => {
    try {
      // Fetch training data
      const { data: trainingData, error: trainingError } = await supabase
        .from('trainings')
        .select('*')
        .eq('id', trainingId)
        .single();

      if (trainingError) {
        console.error('Error fetching training:', trainingError);
        setLoading(false);
        return;
      }

      // Fetch participant data
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', participantId)
        .eq('training_id', trainingId)
        .single();

      if (participantError) {
        console.error('Error fetching participant:', participantError);
        setLoading(false);
        return;
      }

      setTraining(trainingData);
      setParticipant(participantData);
      setIsSigned(participantData.has_signed);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing style
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [loading]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const saveSignature = async () => {
    if (!hasSignature || !trainingId || !participantId) return;

    try {
      // Capture la signature comme une image base64
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const signatureData = canvas.toDataURL('image/png');
      
      const { error } = await supabase
        .from('participants')
        .update({
          has_signed: true,
          is_present: true,
          signature_date: new Date().toISOString(),
          signature_data: signatureData // Stocke les données de la signature
        })
        .eq('id', participantId)
        .eq('training_id', trainingId);

      if (error) {
        console.error('Error saving signature:', error);
        alert('Erreur lors de l\'enregistrement de la signature');
        return;
      }

      setIsSigned(true);
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Erreur lors de l\'enregistrement de la signature');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (!training || !participant) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md w-full shadow-lg border border-primary-200">
          <X className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary-800 mb-4">
            Lien invalide
          </h2>
          <p className="text-primary-600">
            Ce lien de signature n'est pas valide ou a expiré.
          </p>
        </div>
      </div>
    );
  }

  if (isSigned) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md w-full animate-scale-in shadow-lg border border-primary-200">
          <Check className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary-800 mb-4">
            Signature enregistrée !
          </h2>
          <p className="text-primary-600 mb-6">
            Merci {participant.name}, votre signature a été enregistrée avec succès pour la formation "{training.title}".
          </p>
          <div className="bg-primary-50 rounded-lg p-4">
            <div className="text-sm text-primary-700 space-y-1">
              <p><strong>Formation :</strong> {training.title}</p>
              <p><strong>Date :</strong> {new Date(training.start_date).toLocaleDateString('fr-FR')}</p>
              <p><strong>Lieu :</strong> {training.location}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-primary-200 overflow-hidden animate-fade-in shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-primary-200">
            <h1 className="text-2xl font-bold text-primary-800">
              Signature électronique
            </h1>
            <div className="space-y-2 text-sm">
              <p className="text-primary-700">
                <strong>Participant :</strong> {participant.name}
              </p>
              <p className="text-primary-700">
                <strong>Formation :</strong> {training.title}
              </p>
              <p className="text-primary-700">
                <strong>Date :</strong> {new Date(training.start_date).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-primary-700">
                <strong>Lieu :</strong> {training.location}
              </p>
            </div>
          </div>

          {/* Signature Area */}
          <div className="p-6">
            <div className="bg-white rounded-lg border-2 border-accent relative">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-primary-800">
                    <PenTool className="w-5 h-5" />
                    <span className="font-medium">Signez dans la zone ci-dessous</span>
                  </div>
                  <button
                    onClick={clearSignature}
                    className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Effacer</span>
                  </button>
                </div>
                
                <canvas
                  ref={canvasRef}
                  className="w-full h-48 border border-primary-300 rounded cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                
                <p className="text-xs text-primary-500 mt-2 text-center">
                  Utilisez votre doigt ou stylet pour signer
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={saveSignature}
                disabled={!hasSignature}
                className="flex-1 bg-success hover:bg-success-dark disabled:bg-primary-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                <Check className="w-5 h-5" />
                <span>Confirmer la signature</span>
              </button>
            </div>

            <div className="mt-4 p-4 bg-accent bg-opacity-10 rounded-lg border border-accent border-opacity-30">
              <p className="text-primary-800 text-sm">
                <strong>Information :</strong> En signant ce document, vous confirmez votre présence à cette formation. 
                Votre signature sera enregistrée de manière sécurisée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignaturePage;