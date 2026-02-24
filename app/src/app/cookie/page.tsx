import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Cookie, Shield, BarChart3, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Cookie beállítások',
  description: 'A Programláz weboldal cookie-kat használ a legjobb felhasználói élmény biztosítása érdekében. Részletek a cookie típusokról és kezelésükről.',
  robots: { index: true, follow: true },
}

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-[#2D7A4F] hover:text-[#1B5E20] mb-8 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          Vissza a főoldalra
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
              <Cookie className="h-6 w-6 text-[#2D7A4F]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Cookie beállítások
            </h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              A Programláz weboldal cookie-kat használ a legjobb felhasználói élmény biztosítása érdekében. 
              Ez az oldal részletesen ismerteti, hogy milyen cookie-kat használunk és hogyan kezeljük azokat.
            </p>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Shield className="h-6 w-6 text-[#2D7A4F]" />
                Mi az a cookie?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A cookie-k kis szöveges fájlok, amelyeket a weboldal a böngésződbe helyez el. 
                Ezek segítenek a weboldalnak emlékezni a beállításaidra, bejelentkezési adataidra és más információkra, 
                hogy javítsák a felhasználói élményt.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Settings className="h-6 w-6 text-[#2D7A4F]" />
                Milyen cookie-kat használunk?
              </h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-[#2D7A4F] pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Szükséges cookie-k
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Ezek a cookie-k elengedhetetlenek a weboldal működéséhez. Segítenek a bejelentkezési munkamenetek 
                    kezelésében, a biztonság biztosításában és az oldal alapvető funkcióinak működtetésében. 
                    Ezeket a cookie-kat nem lehet kikapcsolni.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Analitikai cookie-k
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Ezek a cookie-k segítenek megérteni, hogyan használják a látogatók a weboldalt. 
                    Információkat gyűjtenek arról, hogy mely oldalakat látogatják leggyakrabban, 
                    mennyi időt töltenek az oldalon, és hogyan navigálnak. Ezek az adatok segítenek 
                    javítani a weboldal működését és felhasználói élményét.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Funkcionális cookie-k
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Ezek a cookie-k lehetővé teszik, hogy a weboldal emlékezzen a választásaidra 
                    (pl. nyelv, régió) és személyre szabott funkciókat nyújtson. 
                    Segítenek a kedvencek mentésében és más beállításokban.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-[#2D7A4F]" />
                Cookie-k kezelése
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                A böngésződ beállításaiban bármikor módosíthatod vagy törölheted a cookie-kat. 
                Azonban fontos megjegyezni, hogy egyes cookie-k eltávolítása vagy letiltása 
                hatással lehet a weboldal működésére és felhasználói élményére.
              </p>
              <p className="text-gray-600 leading-relaxed">
                A legtöbb böngészőben a cookie-kat a Beállítások vagy Beállítások menüben találod, 
                általában az Adatvédelem vagy Biztonság szekcióban.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                További információ
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ha kérdésed van a cookie-k használatával kapcsolatban, kérjük, lépj kapcsolatba velünk:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>E-mail: <a href="mailto:info@programlaz.hu" className="text-[#2D7A4F] hover:text-[#1B5E20] underline">info@programlaz.hu</a></li>
                <li>Telefon: <a href="tel:+36301234567" className="text-[#2D7A4F] hover:text-[#1B5E20] underline">+36 30 123 4567</a></li>
              </ul>
            </section>

            <div className="mt-10 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                Utolsó frissítés: {new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/adatvedelem">
                  <Button variant="outline" size="sm">
                    Adatvédelem
                  </Button>
                </Link>
                <Link href="/aszf">
                  <Button variant="outline" size="sm">
                    ÁSZF
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
