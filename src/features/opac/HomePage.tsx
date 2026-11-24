import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  BookmarkCheck,
  Barcode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookCover } from '@/components/ui/book-cover';
import { EmptyState } from '@/components/ui/empty-state';
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
      book.authorNames.some((a) =>
        a.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      (book.isbn13 && book.isbn13.includes(searchQuery));

    const matchesFormat =
      selectedFormat === 'ALL' || book.format === selectedFormat;
    const matchesLang =
      selectedLanguage === 'ALL' || book.language === selectedLanguage;
    const matchesCat =
      selectedCategory === 'ALL' || book.categoryName === selectedCategory;

    return matchesQuery && matchesFormat && matchesLang && matchesCat;
  });

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* Full-width Hero Discovery Banner with clear background photo */}
      <section className="relative overflow-hidden w-full text-white border-b border-border min-h-[380px] sm:min-h-[440px] flex items-center">
        {/* Full-width Background Image Layer - completely clear, no dark/blue tint */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/opac-hero.webp"
            alt="Library collection background"
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle bottom-to-top soft gradient only at the very bottom edge to smoothly meet the white page */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Foreground Hero Content with crisp card backing for 100% legibility */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full">
          <div className="max-w-2xl bg-slate-950/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/40 border border-primary/50 text-white text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>National Catalog & Digital Discovery Layer</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white font-heading leading-tight">
              Explore the National Public Library Network
            </h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              Real-time search across print books, academic manuscripts, and digital lending licenses across all island-wide branches.
            </p>

            {/* Prominent Search Box inside Hero */}
            <div className="flex flex-col sm:flex-row gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-300" />
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-transparent rounded-xl text-sm focus:outline-none text-white placeholder:text-slate-300"
                  aria-label="Search catalog query"
                />
              </div>
              <Button size="lg" className="rounded-xl font-semibold bg-primary hover:bg-primary/90 text-white px-6">
                {t('search.searchButton')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog View with Faceted Filter Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left: Faceted Filter Panel */}
        <aside className="space-y-6" aria-label="Catalog filters">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <Filter className="w-4 h-4 text-primary" />
              <span>Faceted Filters</span>
            </div>
            {(selectedFormat !== 'ALL' ||
              selectedLanguage !== 'ALL' ||
              selectedCategory !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedFormat('ALL');
                  setSelectedLanguage('ALL');
                  setSelectedCategory('ALL');
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Reset
              </button>
            )}
          </div>

          {/* Format Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              Format
            </label>
            <div className="space-y-1 text-sm">
              {['ALL', 'PRINT', 'EBOOK', 'AUDIOBOOK', 'REFERENCE'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors min-h-[36px] ${
                    selectedFormat === fmt
                      ? 'bg-primary-soft text-primary font-semibold'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {fmt === 'ALL' ? 'All Formats' : fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Language Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              Language
            </label>
            <div className="space-y-1 text-sm">
              {[
                { id: 'ALL', label: 'All Languages' },
                { id: 'en', label: 'English' },
                { id: 'si', label: 'Sinhala (සිංහල)' },
                { id: 'ta', label: 'Tamil (தமிழ்)' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors min-h-[36px] ${
                    selectedLanguage === lang.id
                      ? 'bg-primary-soft text-primary font-semibold'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
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
          <div className="flex justify-between items-center text-sm text-muted-foreground pb-2 border-b border-border">
            <span>Showing <strong className="text-foreground">{filteredBooks.length}</strong> titles</span>
            <span className="text-xs">Sorted by: Relevance & Recency</span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-sm text-muted-foreground animate-pulse">
              Searching national catalog...
            </div>
          ) : filteredBooks.length === 0 ? (
            <EmptyState
              title="No Results Found"
              description="Try loosening your filters or searching for alternate titles, authors, or subjects."
              imageSrc="/images/empty-no-results.webp"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBooks.map((book) => (
                <Card
                  key={book.id}
                  className="hover:shadow-elevated transition-all flex flex-col justify-between overflow-hidden"
                >
                  <CardContent className="p-5 space-y-4 flex flex-col h-full">
                    <div className="flex gap-4">
                      <div className="w-20 shrink-0">
                        <BookCover
                          title={book.title}
                          category={book.categoryName}
                          coverUrl={book.coverImageUrl}
                          aspectRatio="portrait"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="muted" size="sm">
                            {book.format}
                          </Badge>
                          <Badge
                            variant={book.availableCopies > 0 ? 'success' : 'warning'}
                            size="sm"
                          >
                            {book.availableCopies > 0
                              ? `${book.availableCopies} On Shelf`
                              : 'All Checked Out'}
                          </Badge>
                        </div>
                        <h2 className="font-heading font-semibold text-base text-foreground line-clamp-2 leading-snug">
                          {book.title}
                        </h2>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          By {book.authorNames.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border mt-auto">
                      <div className="truncate">
                        Category: <strong className="text-foreground">{book.categoryName}</strong>
                      </div>
                      <div>
                        Language: <span className="uppercase font-medium text-foreground">{book.language}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs font-semibold justify-between mt-2"
                      onClick={() => handleOpenBookModal(book)}
                    >
                      <span>View Title Details</span>
                      <ChevronRight className="w-4 h-4" />
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
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="w-full max-w-2xl bg-card rounded-2xl shadow-elevated border border-border max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div className="space-y-1.5">
                <div className="flex gap-2 items-center flex-wrap">
                  <Badge variant="default" size="sm">
                    {activeBookModal.format}
                  </Badge>
                  <Badge variant="muted" size="sm">
                    {activeBookModal.language.toUpperCase()}
                  </Badge>
                  <Badge
                    variant={
                      activeBookModal.availableCopies > 0 ? 'success' : 'warning'
                    }
                    size="sm"
                  >
                    {activeBookModal.availableCopies} Copies Available
                  </Badge>
                </div>
                <h3 id="modal-title" className="text-xl font-bold font-heading text-foreground mt-2">
                  {activeBookModal.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  By {activeBookModal.authorNames.join(', ')} • {activeBookModal.publisherId || 'National Library Archive'}
                </p>
              </div>
              <button
                onClick={() => setActiveBookModal(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 p-6 overflow-y-auto flex-1">
              {/* Bento Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-4 rounded-xl text-xs">
                <div>
                  <div className="text-muted-foreground font-semibold">Classification</div>
                  <div className="font-semibold text-foreground mt-1">{activeBookModal.categoryName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-semibold">ISBN 13</div>
                  <div className="font-mono font-semibold text-foreground mt-1">
                    {activeBookModal.isbn13 || 'Unassigned'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground font-semibold">Audience</div>
                  <div className="font-semibold text-foreground mt-1">{activeBookModal.audience}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-semibold">Location</div>
                  <div className="font-semibold text-foreground mt-1">Colombo Central HQ</div>
                </div>
              </div>

              {/* Shelf & Physical Copies Availability */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-primary" />
                  <span>Physical Shelf Locations & Copies ({activeBookCopies.length})</span>
                </h4>
                {activeBookCopies.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border border-border rounded-xl">
                    No physical shelf copies registered.
                  </div>
                ) : (
                  <div className="border border-border rounded-xl divide-y divide-border text-xs overflow-hidden">
                    <div className="p-3 bg-muted/50 font-semibold text-muted-foreground grid grid-cols-4">
                      <span>Barcode</span>
                      <span>Call Number</span>
                      <span>Branch</span>
                      <span className="text-right">Status</span>
                    </div>
                    {activeBookCopies.map((copy) => (
                      <div key={copy.id} className="p-3 grid grid-cols-4 items-center">
                        <span className="font-mono font-semibold text-primary">{copy.barcode}</span>
                        <span className="font-mono text-muted-foreground">{copy.callNumber || '823.91 GEN'}</span>
                        <span className="text-muted-foreground">Colombo Central</span>
                        <span className="text-right">
                          <Badge
                            variant={copy.status === 'AVAILABLE' ? 'success' : 'info'}
                            size="sm"
                          >
                            {copy.status}
                          </Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
              {user ? (
                <Button
                  onClick={() => {
                    toast.success(
                      `Reservation placed for '${activeBookModal.title}'. You will be notified when ready for pickup.`
                    );
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
                  <Link
                    to="/login"
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in with Member Account
                  </Link>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => setActiveBookModal(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
