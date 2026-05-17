export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
        <div className="w-12 h-12 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <span className="ml-3 text-gray-500">Đang tải...</span>
    </div>
  );
}