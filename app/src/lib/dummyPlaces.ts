// Közös dummy helyek – később Supabase; kategóriánként 6, ország különböző részein, Unsplash képekkel

export const SLUG_TO_CATEGORY: Record<string, string> = {
  ettermek: 'Étterem',
  szallasok: 'Szállás',
  latnivalok: 'Látnivaló',
  programok: 'Program',
}

export type DummyPlace = {
  id: number
  name: string
  category: string
  description: string
  address: string
  rating: number
  ratingCount: number
  distance: number
  isOpen: boolean
  isPremium: boolean
  priceLevel: number
  lat: number
  lng: number
  imageUrl: string
}

export const dummyPlaces: DummyPlace[] = [
  // Éttermek (6)
  { id: 1, name: 'Mirage Étterem', category: 'Étterem', description: 'Modern európai konyha a város szívében', address: 'Budapest, Fő utca 10.', rating: 4.8, ratingCount: 124, distance: 0.5, isOpen: true, isPremium: true, priceLevel: 3, lat: 47.5052, lng: 19.0469, imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop' },
  { id: 2, name: 'Arany Bika Étkezde', category: 'Étterem', description: 'Híres debreceni fogások, történelmi környezet', address: 'Debrecen, Piac utca 11.', rating: 4.6, ratingCount: 312, distance: 2.1, isOpen: true, isPremium: false, priceLevel: 2, lat: 47.5316, lng: 21.6273, imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop' },
  { id: 3, name: 'Napfényes Étterem', category: 'Étterem', description: 'Mediterrán és magyar ízek Pécs belvárosában', address: 'Pécs, Széchenyi tér 5.', rating: 4.7, ratingCount: 189, distance: 1.8, isOpen: true, isPremium: true, priceLevel: 3, lat: 46.0727, lng: 18.2323, imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop' },
  { id: 4, name: 'Dóm Étterem', category: 'Étterem', description: 'Halászlé és dél-alföldi specialitások', address: 'Szeged, Dóm tér 4.', rating: 4.5, ratingCount: 267, distance: 0.9, isOpen: false, isPremium: false, priceLevel: 2, lat: 46.2530, lng: 20.1482, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=200&fit=crop' },
  { id: 5, name: 'Rába Parti Bistro', category: 'Étterem', description: 'Győri gasztronómia a Rába partján', address: 'Győr, Rába part 2.', rating: 4.9, ratingCount: 98, distance: 1.2, isOpen: true, isPremium: true, priceLevel: 3, lat: 47.6875, lng: 17.6504, imageUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=200&fit=crop' },
  { id: 6, name: 'Szepasszony Vendéglő', category: 'Étterem', description: 'Egri borok és tájházas ételek', address: 'Eger, Dobó István tér 1.', rating: 4.7, ratingCount: 445, distance: 2.4, isOpen: true, isPremium: false, priceLevel: 2, lat: 47.9025, lng: 20.3772, imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=200&fit=crop' },
  // Szállások (6)
  { id: 7, name: 'Hotel Gellért', category: 'Szállás', description: 'Ikónikus fürdőszálló a Gellért-hegy lábánál', address: 'Budapest, Szent Gellért tér 2.', rating: 4.6, ratingCount: 89, distance: 1.2, isOpen: true, isPremium: false, priceLevel: 4, lat: 47.4837, lng: 19.0512, imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop' },
  { id: 8, name: 'Lővér Panzió', category: 'Szállás', description: 'Nyugat-Magyarország, erdei nyugalom', address: 'Sopron, Lővér körút 22.', rating: 4.8, ratingCount: 156, distance: 3.1, isOpen: true, isPremium: true, priceLevel: 2, lat: 47.6817, lng: 16.5844, imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop' },
  { id: 9, name: 'Palota Hotel', category: 'Szállás', description: 'Veszprém történelmi központjában', address: 'Veszprém, Kittenberger K. u. 11.', rating: 4.5, ratingCount: 203, distance: 0.6, isOpen: true, isPremium: false, priceLevel: 3, lat: 47.0933, lng: 17.9133, imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=200&fit=crop' },
  { id: 10, name: 'Balaton Resort', category: 'Szállás', description: 'Nagycsaládos nyaralás Siófokon', address: 'Siófok, Felső sétány 12.', rating: 4.7, ratingCount: 421, distance: 2.0, isOpen: true, isPremium: true, priceLevel: 3, lat: 46.9041, lng: 18.0582, imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=200&fit=crop' },
  { id: 11, name: 'Eger Park Hotel', category: 'Szállás', description: 'Borvidék szélén, Szépasszonyvölgy közelében', address: 'Eger, Szépasszonyvölgy 2.', rating: 4.4, ratingCount: 178, distance: 4.2, isOpen: true, isPremium: false, priceLevel: 2, lat: 47.9080, lng: 20.3820, imageUrl: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&h=200&fit=crop' },
  { id: 12, name: 'Hollókő Falusi Szállás', category: 'Szállás', description: 'UNESCO faluban, tájházas hangulat', address: 'Hollókő, Kossuth L. u. 42.', rating: 4.9, ratingCount: 234, distance: 1.5, isOpen: true, isPremium: true, priceLevel: 2, lat: 47.9986, lng: 19.5911, imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=200&fit=crop' },
  // Látnivalók (6)
  { id: 13, name: 'Budai Vár', category: 'Látnivaló', description: 'Történelmi várnegyed és királyi palota', address: 'Budapest, Szent György tér', rating: 4.9, ratingCount: 456, distance: 2.1, isOpen: true, isPremium: false, priceLevel: 1, lat: 47.4963, lng: 19.0397, imageUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&h=200&fit=crop' },
  { id: 14, name: 'Pécsi Székesegyház', category: 'Látnivaló', description: 'Korai keresztény sírkamrák és dóm', address: 'Pécs, Dóm tér 1.', rating: 4.8, ratingCount: 289, distance: 0.3, isOpen: true, isPremium: false, priceLevel: 1, lat: 46.0789, lng: 18.2289, imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=200&fit=crop' },
  { id: 15, name: 'Egri Vár', category: 'Látnivaló', description: 'A vár védelmezőinek emléke', address: 'Eger, Vár 1.', rating: 4.9, ratingCount: 567, distance: 1.0, isOpen: true, isPremium: false, priceLevel: 1, lat: 47.9035, lng: 20.3775, imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=200&fit=crop' },
  { id: 16, name: 'Szegedi Dóm', category: 'Látnivaló', description: 'Nagytemplom és orgonakoncertek', address: 'Szeged, Dóm tér', rating: 4.7, ratingCount: 198, distance: 0.8, isOpen: true, isPremium: false, priceLevel: 1, lat: 46.2520, lng: 20.1490, imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=200&fit=crop' },
  { id: 17, name: 'Nagytemplom', category: 'Látnivaló', description: 'Debrecen református nagytemploma', address: 'Debrecen, Kossuth tér 1.', rating: 4.6, ratingCount: 312, distance: 0.5, isOpen: true, isPremium: false, priceLevel: 1, lat: 47.5320, lng: 21.6250, imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=200&fit=crop' },
  { id: 18, name: 'Tokaji Hegyalja', category: 'Látnivaló', description: 'Borvidék, pincék és panoráma', address: 'Tokaj, Serényi u. 1.', rating: 4.8, ratingCount: 276, distance: 5.2, isOpen: true, isPremium: true, priceLevel: 2, lat: 48.1167, lng: 21.4167, imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=200&fit=crop' },
  // Programok (6)
  { id: 19, name: 'Széchenyi Fürdő', category: 'Program', description: 'Európa egyik legnagyobb gyógyfürdője', address: 'Budapest, Állatkerti krt. 9-11.', rating: 4.7, ratingCount: 312, distance: 3.5, isOpen: false, isPremium: true, priceLevel: 3, lat: 47.5186, lng: 19.0810, imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=200&fit=crop' },
  { id: 20, name: 'Balaton Strand Fesztivál', category: 'Program', description: 'Nyári koncertek és strand a Balatonon', address: 'Siófok, Petőfi sétány', rating: 4.5, ratingCount: 534, distance: 2.2, isOpen: true, isPremium: false, priceLevel: 2, lat: 46.9080, lng: 18.0620, imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=200&fit=crop' },
  { id: 21, name: 'Szegedi Szabadtéri Játékok', category: 'Program', description: 'Opera és színház a Dóm téren', address: 'Szeged, Dóm tér', rating: 4.9, ratingCount: 678, distance: 1.1, isOpen: true, isPremium: true, priceLevel: 3, lat: 46.2535, lng: 20.1485, imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=200&fit=crop' },
  { id: 22, name: 'Debreceni Virágkarnevál', category: 'Program', description: 'Augusztusi virágfelvonulás', address: 'Debrecen, Nagyerdei park', rating: 4.8, ratingCount: 423, distance: 3.0, isOpen: true, isPremium: false, priceLevel: 2, lat: 47.5450, lng: 21.6380, imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=200&fit=crop' },
  { id: 23, name: 'Pécsi Zsolnay Fesztivál', category: 'Program', description: 'Kerámia, koncertek a Zsolnay negyedben', address: 'Pécs, Zsolnay negyed', rating: 4.6, ratingCount: 267, distance: 1.4, isOpen: true, isPremium: false, priceLevel: 2, lat: 46.0750, lng: 18.2380, imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=200&fit=crop' },
  { id: 24, name: 'Győri Nyár Fesztivál', category: 'Program', description: 'Utcaszínház és koncertek Győrben', address: 'Győr, Révai Miklós u.', rating: 4.7, ratingCount: 189, distance: 0.7, isOpen: true, isPremium: true, priceLevel: 2, lat: 47.6880, lng: 17.6520, imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&h=200&fit=crop' },
]
