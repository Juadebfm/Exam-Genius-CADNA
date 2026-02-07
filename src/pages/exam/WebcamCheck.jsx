import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiCamera, FiCheckCircle } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext.jsx';
import ExamHeader from '../../components/Layout/ExamHeader.jsx';

const WebcamCheck = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const videoRef = useRef(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  const requestCameraAccess = async () => {
    setLoading(true);
    setError('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraEnabled(true);
    } catch (err) {
      setError('Please enable camera access to continue with the exam.');
      setCameraEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const continueToExam = () => {
    navigate(`/exam/${examId}/taking`);
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ExamHeader darkMode={darkMode} onDarkModeToggle={toggleDarkMode} />

      {/* Back Button */}
      <div className="px-6 py-4 pt-24">
        <button
          onClick={() => navigate(`/exam/${examId}/overview`)}
          className={`flex items-center space-x-2 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Overview</span>
        </button>
      </div>

      <div className="py-4 px-4">
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <FiShield className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={1} />
              <h1 className={`text-3xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 text-center`}>Webcam Check</h1>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-6 text-center`}>
                Please enable your webcam and follow the instructions below to proceed with your exam.
              </p>
              
              <div className="flex items-center space-x-2 mb-6 ">
                <FiCamera className={`h-5 w-4 mx-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}/>
                <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'}  `}>Webcam Verification</span>
              </div>
            </div>

            <div className={`w-full h-64 border-2 border-dashed ${darkMode ? 'border-gray-600' : 'border-gray-300'} rounded-lg flex flex-col items-center justify-center mb-8 overflow-hidden p-6`}>
              {cameraEnabled ? (
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                    <FiCheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm font-medium`}>Webcam verified successfully</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                    <FiCamera className={`w-8 h-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-4`}>Click below to enable your webcam for verification</p>
                  <button
                    onClick={requestCameraAccess}
                    disabled={loading}
                    className={`${darkMode ? 'bg-gray-800 border-blue-400 text-blue-400 hover:bg-gray-700' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'} disabled:opacity-50 font-medium py-2 px-6 rounded-lg transition-colors border`}
                  >
                    {loading ? 'Requesting Access...' : 'Enable Webcam'}
                  </button>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-4`}>Instructions</h2>
              <ul className={`list-disc pl-6 space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>Ensure your webcam is properly connected and working.</li>
                <li>Position yourself clearly in front of the camera.</li>
                <li>Make sure you have adequate lighting for clear visibility.</li>
                <li>Do not cover or obstruct the camera during the exam.</li>
              </ul>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className='mt-20'>
              <p className="flex mb-4  mb-6">
                <FiCamera className={`h-5 mx-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-800'}  mb-6`}>Webcam Access</span>
              </p>
              <p className="flex mb-4  mb-6">
                <FiShield className={`h-5 mx-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-800'}  mb-6`}>Face Detection</span>
              </p>
            </div>

            <div className="px-16">
              <button
                onClick={cameraEnabled ? continueToExam : undefined}
                disabled={!cameraEnabled}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${
                  cameraEnabled 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Start Exam
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamCheck;