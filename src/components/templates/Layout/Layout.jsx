import Navigation from '@/components/molecules/Navigation';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="mx-auto lg:max-w-11/12 p-4 lg:px-5 lg:py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;


