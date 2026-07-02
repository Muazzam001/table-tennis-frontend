import Navigation from '@/components/molecules/Navigation';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-11/12 mx-auto lg:px-5 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;


