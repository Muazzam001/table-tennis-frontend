const LoadingOverlay = ({ message = 'Loading…', submessage = null }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="flex flex-col items-center gap-4 rounded-xl bg-white px-8 py-7 shadow-xl max-w-sm w-full text-center">
      <div
        className="h-10 w-10 rounded-full border-4 border-red-100 border-t-red-600 animate-spin"
        aria-hidden="true"
      />
      <div>
        <p className="text-base font-semibold text-gray-900">{message}</p>
        {submessage && <p className="text-sm text-gray-600 mt-1">{submessage}</p>}
      </div>
    </div>
  </div>
);

export default LoadingOverlay;
