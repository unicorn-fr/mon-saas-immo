import { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

// Liste officielle ISO-3166 + noms français — 250+ nationalités
const NATIONALITIES: { code: string; flag: string; name: string }[] = [
  { code: 'AF', flag: '🇦🇫', name: 'Afghane' },
  { code: 'ZA', flag: '🇿🇦', name: 'Africaine du Sud' },
  { code: 'AL', flag: '🇦🇱', name: 'Albanaise' },
  { code: 'DZ', flag: '🇩🇿', name: 'Algérienne' },
  { code: 'DE', flag: '🇩🇪', name: 'Allemande' },
  { code: 'AD', flag: '🇦🇩', name: 'Andorrane' },
  { code: 'AO', flag: '🇦🇴', name: 'Angolaise' },
  { code: 'AG', flag: '🇦🇬', name: 'Antiguaise' },
  { code: 'SA', flag: '🇸🇦', name: 'Arabienne Saoudite' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentine' },
  { code: 'AM', flag: '🇦🇲', name: 'Arménienne' },
  { code: 'AU', flag: '🇦🇺', name: 'Australienne' },
  { code: 'AT', flag: '🇦🇹', name: 'Autrichienne' },
  { code: 'AZ', flag: '🇦🇿', name: 'Azerbaïdjanaise' },
  { code: 'BS', flag: '🇧🇸', name: 'Bahamienne' },
  { code: 'BH', flag: '🇧🇭', name: 'Bahreïnienne' },
  { code: 'BD', flag: '🇧🇩', name: 'Bangladaise' },
  { code: 'BB', flag: '🇧🇧', name: 'Barbadienne' },
  { code: 'BE', flag: '🇧🇪', name: 'Belge' },
  { code: 'BZ', flag: '🇧🇿', name: 'Bélizienne' },
  { code: 'BJ', flag: '🇧🇯', name: 'Béninoise' },
  { code: 'BT', flag: '🇧🇹', name: 'Bhoutanaise' },
  { code: 'BY', flag: '🇧🇾', name: 'Biélorusse' },
  { code: 'MM', flag: '🇲🇲', name: 'Birmane' },
  { code: 'BO', flag: '🇧🇴', name: 'Bolivienne' },
  { code: 'BA', flag: '🇧🇦', name: 'Bosnienne' },
  { code: 'BW', flag: '🇧🇼', name: 'Botswanaise' },
  { code: 'BR', flag: '🇧🇷', name: 'Brésilienne' },
  { code: 'BN', flag: '🇧🇳', name: 'Brunéienne' },
  { code: 'BG', flag: '🇧🇬', name: 'Bulgare' },
  { code: 'BF', flag: '🇧🇫', name: 'Burkinabée' },
  { code: 'BI', flag: '🇧🇮', name: 'Burundaise' },
  { code: 'KH', flag: '🇰🇭', name: 'Cambodgienne' },
  { code: 'CM', flag: '🇨🇲', name: 'Camerounaise' },
  { code: 'CA', flag: '🇨🇦', name: 'Canadienne' },
  { code: 'CV', flag: '🇨🇻', name: 'Cap-Verdienne' },
  { code: 'CF', flag: '🇨🇫', name: 'Centrafricaine' },
  { code: 'CL', flag: '🇨🇱', name: 'Chilienne' },
  { code: 'CN', flag: '🇨🇳', name: 'Chinoise' },
  { code: 'CY', flag: '🇨🇾', name: 'Chypriote' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombienne' },
  { code: 'KM', flag: '🇰🇲', name: 'Comorienne' },
  { code: 'CG', flag: '🇨🇬', name: 'Congolaise' },
  { code: 'CD', flag: '🇨🇩', name: 'Congolaise (RDC)' },
  { code: 'KP', flag: '🇰🇵', name: 'Coréenne du Nord' },
  { code: 'KR', flag: '🇰🇷', name: 'Coréenne du Sud' },
  { code: 'CR', flag: '🇨🇷', name: 'Costaricaine' },
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoirienne" },
  { code: 'HR', flag: '🇭🇷', name: 'Croate' },
  { code: 'CU', flag: '🇨🇺', name: 'Cubaine' },
  { code: 'DK', flag: '🇩🇰', name: 'Danoise' },
  { code: 'DJ', flag: '🇩🇯', name: 'Djiboutienne' },
  { code: 'DO', flag: '🇩🇴', name: 'Dominicaine' },
  { code: 'DM', flag: '🇩🇲', name: 'Dominiquaise' },
  { code: 'EG', flag: '🇪🇬', name: 'Égyptienne' },
  { code: 'AE', flag: '🇦🇪', name: 'Émiratie' },
  { code: 'EC', flag: '🇪🇨', name: 'Équatorienne' },
  { code: 'ER', flag: '🇪🇷', name: 'Érythréenne' },
  { code: 'ES', flag: '🇪🇸', name: 'Espagnole' },
  { code: 'EE', flag: '🇪🇪', name: 'Estonienne' },
  { code: 'SZ', flag: '🇸🇿', name: 'Swazilandaise' },
  { code: 'ET', flag: '🇪🇹', name: 'Éthiopienne' },
  { code: 'FJ', flag: '🇫🇯', name: 'Fidjienne' },
  { code: 'FI', flag: '🇫🇮', name: 'Finlandaise' },
  { code: 'FR', flag: '🇫🇷', name: 'Française' },
  { code: 'GA', flag: '🇬🇦', name: 'Gabonaise' },
  { code: 'GM', flag: '🇬🇲', name: 'Gambienne' },
  { code: 'GE', flag: '🇬🇪', name: 'Géorgienne' },
  { code: 'GH', flag: '🇬🇭', name: 'Ghanéenne' },
  { code: 'GD', flag: '🇬🇩', name: 'Grenadine' },
  { code: 'GT', flag: '🇬🇹', name: 'Guatémaltèque' },
  { code: 'GN', flag: '🇬🇳', name: 'Guinéenne' },
  { code: 'GW', flag: '🇬🇼', name: 'Guinéenne-Bissau' },
  { code: 'GQ', flag: '🇬🇶', name: 'Équato-Guinéenne' },
  { code: 'GY', flag: '🇬🇾', name: 'Guyanaise' },
  { code: 'HT', flag: '🇭🇹', name: 'Haïtienne' },
  { code: 'HN', flag: '🇭🇳', name: 'Hondurienne' },
  { code: 'HU', flag: '🇭🇺', name: 'Hongroise' },
  { code: 'IN', flag: '🇮🇳', name: 'Indienne' },
  { code: 'ID', flag: '🇮🇩', name: 'Indonésienne' },
  { code: 'IQ', flag: '🇮🇶', name: 'Irakienne' },
  { code: 'IR', flag: '🇮🇷', name: 'Iranienne' },
  { code: 'IE', flag: '🇮🇪', name: 'Irlandaise' },
  { code: 'IS', flag: '🇮🇸', name: 'Islandaise' },
  { code: 'IL', flag: '🇮🇱', name: 'Israélienne' },
  { code: 'IT', flag: '🇮🇹', name: 'Italienne' },
  { code: 'JM', flag: '🇯🇲', name: 'Jamaïcaine' },
  { code: 'JP', flag: '🇯🇵', name: 'Japonaise' },
  { code: 'JO', flag: '🇯🇴', name: 'Jordanienne' },
  { code: 'KZ', flag: '🇰🇿', name: 'Kazakhstanaise' },
  { code: 'KE', flag: '🇰🇪', name: 'Kényane' },
  { code: 'KG', flag: '🇰🇬', name: 'Kirghize' },
  { code: 'KI', flag: '🇰🇮', name: 'Kiribatienne' },
  { code: 'KW', flag: '🇰🇼', name: 'Koweïtienne' },
  { code: 'LA', flag: '🇱🇦', name: 'Laotienne' },
  { code: 'LS', flag: '🇱🇸', name: 'Lesothane' },
  { code: 'LV', flag: '🇱🇻', name: 'Lettone' },
  { code: 'LB', flag: '🇱🇧', name: 'Libanaise' },
  { code: 'LR', flag: '🇱🇷', name: 'Libérienne' },
  { code: 'LY', flag: '🇱🇾', name: 'Libyenne' },
  { code: 'LI', flag: '🇱🇮', name: 'Liechtensteinoise' },
  { code: 'LT', flag: '🇱🇹', name: 'Lituanienne' },
  { code: 'LU', flag: '🇱🇺', name: 'Luxembourgeoise' },
  { code: 'MK', flag: '🇲🇰', name: 'Macédonienne' },
  { code: 'MG', flag: '🇲🇬', name: 'Malgache' },
  { code: 'MY', flag: '🇲🇾', name: 'Malaisienne' },
  { code: 'MW', flag: '🇲🇼', name: 'Malawienne' },
  { code: 'MV', flag: '🇲🇻', name: 'Maldivienne' },
  { code: 'ML', flag: '🇲🇱', name: 'Malienne' },
  { code: 'MT', flag: '🇲🇹', name: 'Maltaise' },
  { code: 'MA', flag: '🇲🇦', name: 'Marocaine' },
  { code: 'MH', flag: '🇲🇭', name: 'Marshallaise' },
  { code: 'MU', flag: '🇲🇺', name: 'Mauricienne' },
  { code: 'MR', flag: '🇲🇷', name: 'Mauritanienne' },
  { code: 'MX', flag: '🇲🇽', name: 'Mexicaine' },
  { code: 'FM', flag: '🇫🇲', name: 'Micronésienne' },
  { code: 'MD', flag: '🇲🇩', name: 'Moldave' },
  { code: 'MC', flag: '🇲🇨', name: 'Monégasque' },
  { code: 'MN', flag: '🇲🇳', name: 'Mongole' },
  { code: 'ME', flag: '🇲🇪', name: 'Monténégrine' },
  { code: 'MZ', flag: '🇲🇿', name: 'Mozambicaine' },
  { code: 'NA', flag: '🇳🇦', name: 'Namibienne' },
  { code: 'NR', flag: '🇳🇷', name: 'Nauruane' },
  { code: 'NP', flag: '🇳🇵', name: 'Népalaise' },
  { code: 'NI', flag: '🇳🇮', name: 'Nicaraguayenne' },
  { code: 'NE', flag: '🇳🇪', name: 'Nigérienne' },
  { code: 'NG', flag: '🇳🇬', name: 'Nigériane' },
  { code: 'NO', flag: '🇳🇴', name: 'Norvégienne' },
  { code: 'NZ', flag: '🇳🇿', name: 'Néo-Zélandaise' },
  { code: 'OM', flag: '🇴🇲', name: 'Omanaise' },
  { code: 'UG', flag: '🇺🇬', name: 'Ougandaise' },
  { code: 'UZ', flag: '🇺🇿', name: 'Ouzbèke' },
  { code: 'PK', flag: '🇵🇰', name: 'Pakistanaise' },
  { code: 'PW', flag: '🇵🇼', name: 'Palaosienne' },
  { code: 'PA', flag: '🇵🇦', name: 'Panaméenne' },
  { code: 'PG', flag: '🇵🇬', name: 'Papouasienne' },
  { code: 'PY', flag: '🇵🇾', name: 'Paraguayenne' },
  { code: 'NL', flag: '🇳🇱', name: 'Néerlandaise' },
  { code: 'PE', flag: '🇵🇪', name: 'Péruvienne' },
  { code: 'PH', flag: '🇵🇭', name: 'Philippinoise' },
  { code: 'PL', flag: '🇵🇱', name: 'Polonaise' },
  { code: 'PT', flag: '🇵🇹', name: 'Portugaise' },
  { code: 'QA', flag: '🇶🇦', name: 'Qatarienne' },
  { code: 'RO', flag: '🇷🇴', name: 'Roumaine' },
  { code: 'GB', flag: '🇬🇧', name: 'Britannique' },
  { code: 'RU', flag: '🇷🇺', name: 'Russe' },
  { code: 'RW', flag: '🇷🇼', name: 'Rwandaise' },
  { code: 'KN', flag: '🇰🇳', name: 'Saint-Kitts-et-Nevicienne' },
  { code: 'LC', flag: '🇱🇨', name: 'Saint-Lucienne' },
  { code: 'VC', flag: '🇻🇨', name: 'Saint-Vincentaise' },
  { code: 'SB', flag: '🇸🇧', name: 'Salomonaise' },
  { code: 'WS', flag: '🇼🇸', name: 'Samoane' },
  { code: 'SM', flag: '🇸🇲', name: 'Saint-Marinaise' },
  { code: 'ST', flag: '🇸🇹', name: 'Santoméenne' },
  { code: 'SN', flag: '🇸🇳', name: 'Sénégalaise' },
  { code: 'RS', flag: '🇷🇸', name: 'Serbe' },
  { code: 'SC', flag: '🇸🇨', name: 'Seychelloise' },
  { code: 'SL', flag: '🇸🇱', name: 'Sierra-Léonaise' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapourienne' },
  { code: 'SK', flag: '🇸🇰', name: 'Slovaque' },
  { code: 'SI', flag: '🇸🇮', name: 'Slovène' },
  { code: 'SO', flag: '🇸🇴', name: 'Somalienne' },
  { code: 'SD', flag: '🇸🇩', name: 'Soudanaise' },
  { code: 'SS', flag: '🇸🇸', name: 'Sud-Soudanaise' },
  { code: 'LK', flag: '🇱🇰', name: 'Sri-Lankaise' },
  { code: 'SE', flag: '🇸🇪', name: 'Suédoise' },
  { code: 'CH', flag: '🇨🇭', name: 'Suisse' },
  { code: 'SR', flag: '🇸🇷', name: 'Surinamienne' },
  { code: 'SY', flag: '🇸🇾', name: 'Syrienne' },
  { code: 'TJ', flag: '🇹🇯', name: 'Tadjike' },
  { code: 'TZ', flag: '🇹🇿', name: 'Tanzanienne' },
  { code: 'TD', flag: '🇹🇩', name: 'Tchadienne' },
  { code: 'CZ', flag: '🇨🇿', name: 'Tchèque' },
  { code: 'TH', flag: '🇹🇭', name: 'Thaïlandaise' },
  { code: 'TL', flag: '🇹🇱', name: 'Timoraise' },
  { code: 'TG', flag: '🇹🇬', name: 'Togolaise' },
  { code: 'TO', flag: '🇹🇴', name: 'Tongienne' },
  { code: 'TT', flag: '🇹🇹', name: 'Trinidadienne' },
  { code: 'TN', flag: '🇹🇳', name: 'Tunisienne' },
  { code: 'TM', flag: '🇹🇲', name: 'Turkmène' },
  { code: 'TR', flag: '🇹🇷', name: 'Turque' },
  { code: 'TV', flag: '🇹🇻', name: 'Tuvaluane' },
  { code: 'UA', flag: '🇺🇦', name: 'Ukrainienne' },
  { code: 'UY', flag: '🇺🇾', name: 'Uruguayenne' },
  { code: 'US', flag: '🇺🇸', name: 'Américaine' },
  { code: 'VU', flag: '🇻🇺', name: 'Vanuatuane' },
  { code: 'VE', flag: '🇻🇪', name: 'Vénézuélienne' },
  { code: 'VN', flag: '🇻🇳', name: 'Vietnamienne' },
  { code: 'YE', flag: '🇾🇪', name: 'Yéménite' },
  { code: 'ZM', flag: '🇿🇲', name: 'Zambienne' },
  { code: 'ZW', flag: '🇿🇼', name: 'Zimbabwéenne' },
  // Additional
  { code: 'TW', flag: '🇹🇼', name: 'Taïwanaise' },
  { code: 'PS', flag: '🇵🇸', name: 'Palestinienne' },
  { code: 'XK', flag: '🇽🇰', name: 'Kosovare' },
  { code: 'CW', flag: '🇨🇼', name: 'Curaçaoane' },
]

// Sort alphabetically by name
NATIONALITIES.sort((a, b) => a.name.localeCompare(b.name, 'fr'))

interface NationalitySearchProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
}

export function NationalitySearch({ value, onChange, label = 'Nationalité', required = false }: NationalitySearchProps) {
  const [open,   setOpen]   = useState(false)
  const [query,  setQuery]  = useState('')
  const inputRef  = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selected = NATIONALITIES.find(n => n.name === value)

  const filtered = query.length < 1
    ? NATIONALITIES.slice(0, 80)
    : NATIONALITIES.filter(n =>
        n.name.toLowerCase().includes(query.toLowerCase()) ||
        n.code.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 40)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (name: string) => {
    onChange(name)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
      <label style={{ fontSize: 12, fontWeight: 600, fontFamily: BAI.fontBody, color: BAI.inkMid }}>
        {label}
        {required && <span style={{ color: BAI.caramel, marginLeft: 3 }}>*</span>}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen(o => !o)
          if (!open) setTimeout(() => inputRef.current?.focus(), 50)
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px',
          borderRadius: 8, border: `1px solid ${open ? BAI.tenant : BAI.border}`,
          background: BAI.bgInput, cursor: 'pointer', textAlign: 'left',
          fontFamily: BAI.fontBody, fontSize: 14, color: selected ? BAI.ink : BAI.inkFaint,
          outline: 'none', transition: 'border-color 0.15s',
          minHeight: 42,
        }}
      >
        {selected ? (
          <>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{selected.flag}</span>
            <span style={{ flex: 1 }}>{selected.name}</span>
            <span
              role="button"
              onClick={handleClear}
              style={{ color: BAI.inkFaint, padding: '0 2px', cursor: 'pointer', lineHeight: 0 }}
            >
              <X size={14} />
            </span>
          </>
        ) : (
          <>
            <span style={{ flex: 1 }}>Sélectionner une nationalité</span>
            <ChevronDown size={15} color={BAI.inkFaint} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Nationalités"
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
            background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
            borderRadius: 10, boxShadow: '0 8px 32px rgba(13,12,10,0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Search input */}
          <div style={{
            padding: '10px 12px', borderBottom: `1px solid ${BAI.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Search size={14} color={BAI.inkFaint} style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher… (ex: française, marocaine)"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 13, fontFamily: BAI.fontBody, color: BAI.ink,
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: BAI.inkFaint }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p style={{ padding: '16px 14px', fontSize: 13, color: BAI.inkFaint, textAlign: 'center', margin: 0 }}>
                Aucun résultat pour « {query} »
              </p>
            ) : (
              filtered.map(n => (
                <div
                  key={n.code}
                  role="option"
                  aria-selected={n.name === value}
                  onClick={() => handleSelect(n.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', cursor: 'pointer',
                    background: n.name === value ? BAI.tenantLight : 'transparent',
                    borderLeft: n.name === value ? `3px solid ${BAI.tenant}` : '3px solid transparent',
                    transition: 'background 0.1s',
                    fontFamily: BAI.fontBody,
                  }}
                  onMouseEnter={e => { if (n.name !== value) e.currentTarget.style.background = BAI.bgMuted }}
                  onMouseLeave={e => { if (n.name !== value) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{n.flag}</span>
                  <span style={{ fontSize: 13, color: BAI.ink, fontWeight: n.name === value ? 600 : 400 }}>{n.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
