import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient, API_ENDPOINTS } from "../config/api";
import Loading from "../components/UI/Loading";

const ExamAccessPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        if (!examId) {
          throw new Error('No exam ID provided');
        }

        const response = await apiClient.get(API_ENDPOINTS.EXAM_DETAILS(examId));
        
        if (response.success && response.data) {
          setExam(response.data);
        } else {
          throw new Error(response.message || 'Failed to load exam');
        }
      } catch (error) {
        console.error('Failed to load exam:', error);
        setError(error.message || 'Failed to load exam');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [examId]);

  const startExam = () => {
    if (examId) {
      navigate(`/take-exam/${examId}`);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!exam) return <div className="p-4">Exam not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{exam.title}</h1>
        <p className="text-gray-600 mb-6">{exam.description}</p>
        
        <div className="space-y-2 mb-6">
          <p><strong>Duration:</strong> {exam.timeLimit} minutes</p>
          <p><strong>Questions:</strong> {exam.questions?.length || 0}</p>
        </div>


        <button
        
          onClick={startExam}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
        >
          Start Exam
        </button>
      </div>
    </div>
  );
};

export default ExamAccessPage;