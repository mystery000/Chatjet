import { TeamSettingsLayout } from '@/components/layouts/TeamSettingsLayout';
import PlanPicker from '@/components/team/PlanPicker';
import useTeam from '@/lib/hooks/use-team';
import { getTierDetailsFromPriceId } from '@/lib/stripe/tiers';

const Team = () => {
  const { team } = useTeam();

  let tierName: string | undefined;
  if (team?.is_enterprise_plan) {
    tierName = 'Enterprise';
  } else if (team?.stripe_price_id) {
    tierName = getTierDetailsFromPriceId(team.stripe_price_id)?.name;
  } else {
    tierName = 'Hobby';
  }

  return (
    <TeamSettingsLayout
      title="Plans"
      SubHeading={() => {
        if (!team) {
          return <></>;
        }
        return (
          <p className="mb-6 text-sm text-neutral-500">
            You are currently on the{' '}
            <span className="font-semibold text-neutral-400">{tierName}</span>{' '}
            plan.
          </p>
        );
      }}
    >
      <PlanPicker />
    </TeamSettingsLayout>
  );
};

export default Team;
