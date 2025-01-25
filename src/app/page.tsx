import {About, Courses, Footer, Gallery, Header, Navbar, Testimonials} from '@/components';

export const metadata = {
  title: "Alejandra Academia | Estética y Belleza",
  description: "Alejandra Academia es un espacio especializado en formación en estética y belleza, ofreciendo cursos prácticos y teóricos para todos los niveles.",
  keywords: "Alejandra Academia, cursos de estética, belleza, formación en estética, academia de belleza, maquillaje, peluquería, técnicas de belleza ",
  author: "Alejandra Academia",
  robots: "index, follow",
  og: {
    title: "Alejandra Academia | Formación en Estética y Belleza",
    description: "Descubre Alejandra Academia, tu espacio ideal para aprender todo sobre estética y belleza. Cursos especializados y expertos en el área.",
    image: "logoSpa.svg",
    url: "https://www.alejandracademia.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alejandra Academia | Formación en Estética y Belleza",
    description: "Alejandra Academia ofrece cursos en estética y belleza. Aprende con los mejores en el sector.",
    image: "logoSpa.svg",
  },
  viewport: "width=device-width, initial-scale=1",
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
