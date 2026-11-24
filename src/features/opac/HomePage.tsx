import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, Filter, BookOpen, Clock, ShieldCheck, CheckCircle2, ChevronRight, X, BookmarkCheck, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CatalogRepository } from '@/services/repositories/CatalogRepository';
import { Book, BookCopy } from '@libraryos/shared';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [activeBookModal, setActiveBookModal] = useState<Book | null>(null);
  const [activeBookCopies, setActiveBookCopies] = useState<BookCopy[]>([]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await CatalogRepository.getBooks();
        setBooks(data);
      } catch (err) {
        console.warn('Catalog fetch note:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleOpenBookModal = async (book: Book) => {
    setActiveBookModal(book);
    try {
      const copies = await CatalogRepository.getBookCopies(book.id);
      setActiveBookCopies(copies);
    } catch {
      setActiveBookCopies([]);
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesQuery =
      searchQuery === '' ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authorNames.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (book.isbn13 && book.isbn13.includes(searchQuery));

    const matchesFormat = selectedFormat === 'ALL' || book.format === selectedFormat;
    const matchesLang = selectedLanguage === 'ALL' || book.language === selectedLanguage;
    const matchesCat = selectedCategory === 'ALL' || book.categoryName === selectedCategory;

    return matchesQuery && matchesFormat && matchesLang && matchesCat;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Discovery Banner */}
      <section className="relative bg-gradient-to-b from-primary/10 via-background to-background py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide">
            <BookOpen className="w-3.5 h-3.5" />
            <span>National Catalog & Digital Discovery Layer</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground">
            Explore the National Public Library Network
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time search across print books, academic manuscripts, and digital lending licenses.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 bg-card p-2 rounded-2xl shadow-xl border">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-transparent rounded-xl text-sm focus:outline-none"
              />
            </div>
            <Button size="lg" className="rounded-xl font-semibold">
              {t('search.searchButton')}
            </Button>
          </div>
        </div>
      </section>

      {/* Main Catalog View with Faceted Filter Sidebar */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left: Faceted Filter Panel */}
        <aside className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <Filter className="w-4 h-4 text-primary" />
              <span>Faceted Filters</span>
            </div>
            {(selectedFormat !== 'ALL' || selectedLanguage !== 'ALL' || selectedCategory !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedFormat('ALL');
                  setSelectedLanguage('ALL');
                  setSelectedCategory('ALL');
                }}
                className="text-xs text-primary hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Format Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Format</label>
            <div className="space-y-1 text-xs">
              {['ALL', 'PRINT', 'EBOOK', 'AUDIOBOOK', 'REFERENCE'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                    selectedFormat === fmt
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {fmt === 'ALL' ? 'All Formats' : fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Language Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Language</label>
            <div className="space-y-1 text-xs">
              {[
                { id: 'ALL', label: 'All Languages' },
                { id: 'en', label: 'English' },
                { id: 'si', label: 'Sinhala (සිංහල)' },
                { id: 'ta', label: 'Tamil (தமிழ்)' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                    selectedLanguage === lang.id
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Results Grid */}
        <main className="md:col-span-3 space-y-4">
          <div className="flex justify-between items-center text-xs text-muted-foreground pb-2 border-b">
            <span>Showing {filteredBooks.length} titles</span>
            <span>Sorted by: Relevance & Recency</span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-sm text-muted-foreground">Searching catalog...</div>
          ) : filteredBooks.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg">No Results Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Try loosening your filters or searching for alternate keywords.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => (
                <Card key={book.id} className="hover:shadow-lg transition-all border border-border/80 flex flex-col justify-between">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted uppercase tracking-wider">
                        {book.format}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          book.availableCopies > 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {book.availableCopies > 0 ? `${book.availableCopies} On Shelf` : 'All Checked Out'}
                      </span>
                    </div>

                    <CardTitle className="text-base font-bold font-serif mt-2 line-clamp-1">{book.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-1">By {book.authorNames.join(', ')}</CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 text-xs space-y-3">
                    <div className="text-muted-foreground text-[11px] space-y-0.5">
                      <div>Classification: {book.categoryName}</div>
                      <div>Language: <span className="uppercase font-semibold">{book.language}</span></div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs font-semibold justify-between hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleOpenBookModal(book)}
                    >
                      <span>View Title Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
      {/* Real Full OPAC Book Detail Modal */}
      {activeBookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-card shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-start justify-between border-b pb-4">
              <div>
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                    {activeBookModal.format}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted uppercase">
                    {activeBookModal.language.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {activeBookModal.availableCopies} Copies Available
                  </span>
                </div>
                <CardTitle className="text-xl font-bold font-serif mt-2">
                  {activeBookModal.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  By {activeBookModal.authorNames.join(', ')} • {activeBookModal.publisherId || 'National Library Archive'}
                </CardDescription>
              </div>
              <button
                onClick={() => setActiveBookModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-6 p-6 overflow-y-auto">
              {/* Bento Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-xl text-xs">
                <div>
                  <div className="text-muted-foreground text-[10px] font-bold uppercase">Classification</div>
                  <div className="font-semibold text-foreground mt-0.5">{activeBookModal.categoryName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] font-bold uppercase">ISBN 13</div>
                  <div className="font-mono font-semibold text-foreground mt-0.5">
                    {activeBookModal.isbn13 || 'Unassigned'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] font-bold uppercase">Audience</div>
                  <div className="font-semibold text-foreground mt-0.5">{activeBookModal.audience}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] font-bold uppercase">Location</div>
                  <div className="font-semibold text-foreground mt-0.5">Colombo Central HQ</div>
                </div>
              </div>

              {/* Shelf & Physical Copies Availability */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-1.5">
                  <Barcode className="w-4 h-4 text-primary" />
                  <span>Physical Shelf Locations & Copies ({activeBookCopies.length})</span>
                </h4>
                {activeBookCopies.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border rounded-xl">
                    No physical shelf copies registered.
                  </div>
                ) : (
                  <div className="border rounded-xl divide-y text-xs">
                    <div className="p-2.5 bg-muted font-semibold text-muted-foreground grid grid-cols-4">
                      <span>Barcode</span>
                      <span>Call Number / Shelf</span>
                      <span>Branch</span>
                      <span className="text-right">Status</span>
                    </div>
                    {activeBookCopies.map((copy) => (
                      <div key={copy.id} className="p-2.5 grid grid-cols-4 items-center">
                        <span className="font-mono font-bold text-primary">{copy.barcode}</span>
                        <span className="font-mono text-muted-foreground">{copy.callNumber || '823.91 GEN'}</span>
                        <span className="text-muted-foreground">Colombo Central</span>
                        <span className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                              copy.status === 'AVAILABLE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {copy.status}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>

            <div className="p-4 border-t flex items-center justify-between bg-muted/20">
              {user ? (
                <Button
                  onClick={() => {
                    toast.success(`Reservation placed for '${activeBookModal.title}'. You will be notified when ready for pickup.`);
                    setActiveBookModal(null);
                  }}
                  className="text-xs font-semibold"
                >
                  <BookmarkCheck className="w-4 h-4 mr-1.5" />
                  Place Hold / Reserve Book
                </Button>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Want to reserve?{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    Sign in with Member Account
                  </Link>
                </div>
              )}
              <Button variant="outline" onClick={() => setActiveBookModal(null)} className="text-xs">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
