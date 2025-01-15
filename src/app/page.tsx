import {About, Courses, Footer, Gallery, Header, Navbar, Testimonials} from '@/components';

export const metadata = {
  title: "Inicio | Alejandra Academia",
  description: "Alejandra Academia es un espacio para aprender sobre estética y belleza.",
};

export default function Home() {

  return (
    <>
      <Navbar />
      <Header />
      <About />
      <Courses />
      <Gallery />
      <Testimonials />
      <Footer />
    </>
  );
}
