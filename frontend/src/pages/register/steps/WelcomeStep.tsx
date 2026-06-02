import { GymCodeIcon } from '../../../components/GymCodeIcon';

export default function WelcomeStep() {
  return (
    <div className="text-center py-2">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-accent rounded-[22px] mb-6 shadow-medium">
        <GymCodeIcon size={40} className="text-white" />
      </div>
      <p className="text-sm font-medium text-accent-600 mb-2">Gym Code para Personal Trainers</p>
    </div>
  );
}
