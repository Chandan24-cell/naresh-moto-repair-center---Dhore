import enTranslations from './en.json';
import neTranslations from './ne.json';

export type Language = 'en' | 'np';

export interface BlogPost {
  id: string;
  slug: string;
  titleEn: string;
  titleNp: string;
  excerptEn: string;
  excerptNp: string;
  readTime: string;
  date: string;
  category: string;
  relatedServiceId: string;
  contentEn: string[];
  contentNp: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: '5-signs-bike-needs-service',
    titleEn: '5 Signs Your Bike Needs a Service Before the Next Long Ride',
    titleNp: 'लामो यात्रामा निस्कनु अघि बाइक सर्भिसिङ गराउनु पर्ने ५ मुख्य लक्षणहरू',
    excerptEn: 'From sluggish throttle response to subtle metallic scraping, identify the early warnings that prevent expensive highway breakdowns.',
    excerptNp: 'कमजोर पिकअपदेखि असामान्य आवाजसम्म, महँगो बिगबिगीबाट बच्न यी ५ चेतावनी संकेतहरू चिन्नुहोस्।',
    readTime: '3 min read',
    date: 'Sep 2026',
    category: 'Preventative Care',
    relatedServiceId: '01-general-servicing',
    contentEn: [
      'Heading out towards Pathlaiya, Hetauda, or Kathmandu from Dhore requires complete confidence in your machine. The first red flag is delayed throttle response or cold morning hesitation, which often indicates clogged carburetor pilot jets or dirty spark plugs.',
      'Secondly, pay attention to brake lever spongy feel. Hydraulic brake fluid absorbs atmospheric moisture over time, leading to brake fade on downward slopes. Third, check chain slack — excess movement wears down drive sprockets rapidly.',
      'Fourth, notice any dark metallic soot around the exhaust tip, hinting at improper air-fuel mixture or failing piston rings. Lastly, inspect tyre tread depth for uneven center-wear caused by incorrect tire pressure.',
      'A timely 45-minute periodic service at Naresh Moto saves costly roadside towing and preserves engine longevity.'
    ],
    contentNp: [
      'वीरगन्जबाट पथलैया, हेटौंडा वा काठमाडौंको लामो यात्रामा निस्कँदा आफ्नो मोटरसाइकल पूर्ण रूपमा दुरुस्त हुन आवश्यक छ। पहिलो मुख्य लक्षण थ्रोटल ढिलो चल्नु वा बिहान स्टार्ट हुन गाह्रो हुनु हो, जसले क्लिन गर्नुपर्ने कार्बोरेटर वा स्पार्क प्लगको संकेत गर्दछ।',
      'दोस्रो, ब्रेक लिभर खुकुलो वा स्पन्ज जस्तो हुनु। ब्रेक आयल पुरानो हुँदा ओरालो बाटोमा ब्रेक कमजोर हुन सक्छ। तेस्रो, चेन खुकुलो हुनु जसले स्प्रोकेटलाई चाँडै बिगार्छ।',
      'चौथो, साइलेन्सरबाट कालो धुवाँ वा धातुको अनौठो आवाज आउनु, जसले इन्जिन आयल वा पिस्टनमा समस्या देखाउँछ। पाँचौँ, टायरको ग्रिप कमजोर हुनु।',
      'नरेश मोटोमा समयमै गरिने ४५ मिनेटको नियमित चेकजाँचले तपाईंको सुरक्षित यात्रा सुनिश्चित गर्छ।'
    ]
  },
  {
    id: 'post-2',
    slug: 'chain-care-101-Dhore-roads',
    titleEn: 'Chain Care 101: Keeping Your Bike Smooth on Dhore Roads',
    titleNp: 'चेन केयर १०१: वीरगन्जका धुलो बाटोहरूमा बाइकलाई सधैं स्मूथ राख्ने तरिका',
    excerptEn: 'Dust, sand, and monsoon grime quickly destroy drive chains. Learn the proper cleaning and lubrication routine.',
    excerptNp: 'धुलो, बालुवा र हिलोले ड्राइभ चेन चाँडै बिगार्छ। उचित सरसफाइ र लुब्रिकेसनको सही तरिका जान्नुहोस्।',
    readTime: '2 min read',
    date: 'Aug 2026',
    category: 'Maintenance',
    relatedServiceId: '03-brakes-tyres',
    contentEn: [
      'Motorcycle drive chains take the hardest punishment on dusty roads around Dhore, Pakahamainpur, and dry bypass highways. Fine grit mixes with old lube, creating an abrasive grinding paste that stretches chain links prematurely.',
      'Clean your chain every 500 to 700 km using kerosene or specialized chain cleaner with a 3-sided grunge brush. Never use high-pressure water jets directly onto sealed O-ring or X-ring chains as it forces water past rubber seals.',
      'After thorough drying, apply high-tack motorcycle chain lube to the inner rollers. Allow it to set for 15 minutes before riding so centrifugal force does not fling lubricant onto your rear wheel and tyre.',
      'Maintain correct 20-30mm chain free-play to prevent unnecessary strain on gearbox countershaft bearings.'
    ],
    contentNp: [
      'वीरगन्ज, पकहामैनपुर र वरपरका कच्ची तथा धुलाम्य सडकहरूमा मोटरसाइकलको चेनले सबैभन्दा धेरै मार खेप्छ। बालुवा र धुलो पुरानो मोबिलसँग मिसिएर चेनका लिंकहरू चाँडै खिइने गर्दछन्।',
      'प्रत्येक ५०० देखि ७०० किमीमा मट्टितेल वा चेन क्लिनरले ब्रसको सहायताले चेन सफा गर्नुहोस्। डाइरेक्ट प्रेसर पानीले ओ-रिङ चेनमा असर पुर्याउन सक्छ।',
      'राम्रोसँग सुकेपछि गुणस्तरीय चेन ल्युब मात्र प्रयोग गर्नुहोस्। ल्युब लगाएको १५ मिनेटसम्म बाइक नचलाउनुहोस् ताकि तेल टायरमा नछिट्टियोस्।',
      'चेनमा २० देखि ३० मिमीको उचित खुकुलोपन राख्नुहोस् जसले गियरबक्सको बियरिङलाई सुरक्षित राख्छ।'
    ]
  },
  {
    id: 'post-3',
    slug: 'monsoon-bike-maintenance-checklist',
    titleEn: 'Monsoon Bike Maintenance Checklist for Nepal Riders',
    titleNp: 'नेपालमा वर्षायामको लागि मोटरसाइकल मर्मत तथा सुरक्षा चेकलिस्ट',
    excerptEn: 'Waterlogged streets, battery corrosion, and rust hazards: protect your two-wheeler throughout heavy rains.',
    excerptNp: 'पानी जम्ने सडक, ब्याट्रीमा खिया र ब्रेक स्लिप: भारी वर्षाको समयमा आफ्नो बाइकलाई सुरक्षित राख्ने उपाय।',
    readTime: '4 min read',
    date: 'Jul 2026',
    category: 'Seasonal Care',
    relatedServiceId: '04-electrical-work',
    contentEn: [
      'Monsoon rains present unique mechanical challenges across Madhesh Province. Water splashing onto ignition coils and spark plug caps can cause instant misfires and engine stalling during deep puddle crossings.',
      'Coat electrical couplers, fuse boxes, and battery terminals with petroleum jelly or anti-corrosive dielectric grease to block moisture infiltration.',
      'Drum brakes and disc rotors require immediate attention after riding in water. Wet brake drum linings lose up to 40% stopping power until pumped gently to dry out.',
      'Check fork dust boots and shock absorbers for mud accumulation. If grit slips past fork oil seals, it will score the chrome stanchions and cause costly hydraulic leakage.'
    ],
    contentNp: [
      'तराई तथा मधेश प्रदेशमा वर्षायाममा पानी जमेका सडकहरूमा सवारी चलाउँदा स्पार्क प्लग क्याप र वाइरिङमा पानी पसेर बाइक एक्कासि बन्द हुन सक्छ।',
      'ब्याट्रीका टर्मिनल र फ्युज बक्समा पेट्रोलियम जेली वा ग्रिज लगाउनाले खिया लाग्नबाट जोगाउँछ।',
      'पानीमा बाइक चलाइसकेपछि ब्रेक ड्रम भित्र पानी पस्न सक्छ, जसले गर्दा ब्रेक कमजोर हुन्छ। हल्का ब्रेक च्यापेर चलाउँदा घर्षणले गर्दा ड्रम छिट्टै सुक्छ।',
      'सस्पेन्सनको धुलो कभर र सक-एब्जर्भर नियमित सफा राख्नुहोस् ताकि माटो र हिलोले फोर्क आयल सिल नकाटियोस्।'
    ]
  },
  {
    id: 'post-4',
    slug: 'why-genuine-parts-matter',
    titleEn: 'Why Genuine Parts Matter for Hero, Bajaj, Honda, TVS & Yamaha Bikes',
    titleNp: 'हिरो, बजाज, होन्डा, टिभिएस र यामाहामा सक्कली पार्ट्स किन अनिवार्य छ?',
    excerptEn: 'Cheap duplicates might save Rs 200 today but cost Rs 10,000 in engine overhauls tomorrow.',
    excerptNp: 'नक्कली पार्ट्सले आज रु २०० बचाउन सक्ला तर भोलि रु १०,००० को इन्जिन बिगार्न सक्छ।',
    readTime: '3 min read',
    date: 'Jun 2026',
    category: 'Parts & Reliability',
    relatedServiceId: '07-genuine-spare-parts',
    contentEn: [
      'The Dhore spare parts market is flooded with counterfeit packaging mimicking reputed OEM brands. While duplicate brake shoes or counterfeit clutch plates appear identical on the outside, their metallurgical standards are dangerously inferior.',
      'Substandard brake pads rapidly score expensive disc rotors, while cheap clutch plates disintegrate under heat, sending abrasive fiber debris into the engine crankcase and blocking vital oil passages.',
      'At Naresh Moto Repair Center, we maintain direct inventory of factory-sealed Hero Genuine Parts, Bajaj Genuine Parts, Yamaha Yamalube, and TVS Tru4 oils. Genuine parts maintain precise tolerances, fuel economy, and factory power output.',
      'Always insist on genuine parts with manufacturer holograms for uninterrupted daily reliability.'
    ],
    contentNp: [
      'बजारमा आजभोलि सक्कली जस्तै देखिने नक्कली पार्ट्सहरूको बिगबिगी छ। हेर्दा दुरुस्त देखिए पनि तिनीहरूको गुणस्तर अत्यन्त कमजोर हुन्छ।',
      'कमजोर ब्रेक प्याडले महँगो डिस्क प्लेटलाई कोरिने बनाउँछ र नक्कली क्लच प्लेट तातेर टुक्रिँदा इन्जिनको मोबिल सर्कुलेसन जाम हुन पुग्छ।',
      'नरेश मोटो रिपेयर सेन्टरमा हामी १००% सक्कली हिरो, बजाज, होन्डा, यामाहा र टिभिएस पार्ट्स मात्र प्रयोग गर्दछौं। सक्कली पार्ट्सले बाइकको माइलेज र आयु दुवै बढाउँछ।',
      'सधैं निर्माताको होलोग्राम भएको सक्कली पार्ट्सको मात्र माग गर्नुहोस्।'
    ]
  }
];

export const TRANSLATIONS = {
  en: enTranslations,
  np: neTranslations
};
