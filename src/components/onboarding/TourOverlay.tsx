import { motion, AnimatePresence } from 'framer-motion'
import { Music, Edit3, Guitar, ListMusic } from 'lucide-react'
import { useOnboardingStore } from '../../store/useOnboardingStore'
import { useAuthStore } from '../../store/useAuthStore'
import { Button } from '../ui/Button'

const STEPS = [
  {
    icon: Music,
    title: 'Benvenuto in RiChord',
    description: 'La tua libreria musicale sempre pronta. Aggiungi brani ChordPro, PDF e immagini. Tutto organizzato, sempre a portata di mano.',
    cta: 'Inizia il tour',
  },
  {
    icon: Edit3,
    title: "L'editor brani",
    description: "Incolla il testo del brano, poi tocca una lettera per inserire un accordo esattamente sopra quella sillaba. Semplice e preciso.",
    cta: 'Avanti',
  },
  {
    icon: Guitar,
    title: 'Selettore accordi',
    description: "Scegli la nota (Do, Re, Mi…) con eventuale diesis o bemolle, poi la variante (m, 7, maj7…). L'accordo si posiziona sopra la sillaba.",
    cta: 'Avanti',
  },
  {
    icon: ListMusic,
    title: 'Setlist e condivisione',
    description: 'Crea setlist per ogni evento, riordina i brani con drag & drop, imposta la tonalità della serata e condividi con un link temporaneo.',
    cta: 'Inizia a usare RiChord',
  },
]

export function TourOverlay() {
  const { active, step, nextStep, skipTour } = useOnboardingStore()
  const user = useAuthStore((s) => s.user)

  const currentStep = STEPS[step]
  const Icon = currentStep?.icon

  return (
    <AnimatePresence>
      {active && currentStep && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-night-base/80 backdrop-blur-sm" />
          <motion.div
            className="relative bg-white dark:bg-night-surface rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
          >
            {/* Step indicators */}
            <div className="flex gap-1.5 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full flex-1 transition-colors duration-300 ${
                    i <= step ? 'bg-blue-accent' : 'bg-gray-200 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-5">
              {Icon && <Icon size={26} className="text-blue-accent" />}
            </div>

            {/* Content */}
            <h2 className="text-xl font-display text-primary-light dark:text-primary-dark mb-3">
              {currentStep.title}
            </h2>
            <p className="text-sm text-secondary font-jakarta leading-relaxed mb-8">
              {currentStep.description}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button onClick={nextStep} size="lg" className="w-full">
                {currentStep.cta}
              </Button>
              {step < STEPS.length - 1 && (
                <button
                  onClick={() => skipTour(user?.id)}
                  className="text-sm text-secondary font-jakarta hover:text-primary-light dark:hover:text-primary-dark transition-colors py-2"
                >
                  Salta il tour
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
