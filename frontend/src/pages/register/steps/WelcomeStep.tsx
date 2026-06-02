import { GymCodeIcon } from '../../../components/GymCodeIcon';

export default function WelcomeStep() {
  return (
    <div className="text-center py-2">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1D1D1F] rounded-[22px] mb-6 shadow-md">
        <GymCodeIcon size={40} className="text-white" />
      </div>
      <p className="text-sm font-medium text-[#6E6E73] mb-2">Gym Code para Personal Trainers</p>
    </div>
  );
}
