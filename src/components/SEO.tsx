import { Helmet } from 'react-helmet-async';

type SEOProps = {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  schema?: Record<string, any>;
};

const siteUrl = 'https://formation.biteckethan.com';
const defaultImage = 'https://formation.biteckethan.com/og-image.jpg';

const defaultDescription =
  'Biteck De Bong Ethan Cade et Made Easy Tech offrent des formations en informatique, marketing digital, bureautique, développement web et design à Douala et en Afrique francophone. Apprenez l’informatique, obtenez une certification bureautique et boostez votre carrière avec des parcours pratiques et reconnus.';

const defaultKeywords =
  'C&B Services, Biteck Ethan Formation, formation informatique, marketing digital, bureautique, développement web, design, certification bureautique, formation à Douala, formation Afrique francophone, Biteck De Bong Ethan Cade, Made Easy Tech, dev, dev web, mkdg, TIC, SEO, e-learning, cours en ligne, formation digitale, formation professionnelle, formation certifiante, formation en ligne, formation présentielle, formation hybride, formation continue, formation pour débutants, formation avancée, formation sur mesure, formation en entreprise, formation à distance, formation en présentiel, formation en ligne, formation en blended learning, formation en bootcamp, formation accélérée, formation pour les jeunes, formation pour les professionnels, formation pour les entrepreneurs, formation pour les freelances, formation pour les demandeurs d’emploi, formation pour les passionnés d’informatique et de marketing digital.';

const organizationSchema = {
  '@type': 'EducationalOrganization',
  name: 'C&B Services',
  legalName: 'C&B Services',
  brand: {
    '@type': 'Brand',
    name: 'Biteck Ethan Formation',
  },
  url: siteUrl,
  logo: defaultImage,
  description: defaultDescription,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Douala',
    addressRegion: 'Littoral',
    addressCountry: 'CM',
  },
  sameAs: ['https://formation.biteckethan.com'],
};

const personSchema = {
  '@type': 'Person',
  name: 'Biteck De Bong Ethan Cade',
  alternateName: ['Biteck Ethan Cade', 'Biteck De Bong Ethan', 'Cade', 'Made Easy Tech'],
  jobTitle: 'Formateur en informatique, marketing digital et développement web',
  url: siteUrl,
};

export function SEO({
  title,
  description = defaultDescription,
  keywords = defaultKeywords,
  image = defaultImage,
  url = '/',
  schema,
}: SEOProps) {
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': schema ? [organizationSchema, personSchema, schema] : [organizationSchema, personSchema],
  };

  return (
    <Helmet>
      <title>{`${title} | Biteck Ethan Formation`}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullUrl} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Made Easy Tech" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
