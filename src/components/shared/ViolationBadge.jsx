/**
 * ViolationBadge — shown in ExamTaking and ExamReview when
 * the student has triggered anti-cheating violations.
 *
 * Props:
 *   count — number of violations
 */
const ViolationBadge = ({ count }) => (
  <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md ${
    count >= 5 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
  }`}>
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <span className="text-xs font-semibold">
      {count} violation{count !== 1 ? 's' : ''}
    </span>
  </div>
);

export default ViolationBadge;
