import { Check } from 'lucide-react';

interface StepTimelineProps {
  currentStep: number;
  steps: string[];
}

export default function StepTimeline({ currentStep, steps }: StepTimelineProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-[#007bff] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? <Check size={20} /> : stepNumber}
                </div>
                <p
                  className={`mt-2 text-sm font-medium text-center w-20 ${
                    isCurrent ? 'text-[#007bff]' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {step}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 transition-all ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ minWidth: '50px' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
