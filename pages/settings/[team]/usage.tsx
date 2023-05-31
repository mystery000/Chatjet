import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Progress from '@radix-ui/react-progress';
import cn from 'classnames';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { ChevronsUpDown, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import BarChart, { BarChartData } from '@/components/charts/bar-chart';
import { TeamSettingsLayout } from '@/components/layouts/TeamSettingsLayout';
import Button from '@/components/ui/Button';
import useTeam from '@/lib/hooks/use-team';
import { getMonthlyQueryAllowance } from '@/lib/stripe/tiers';
import { fetcher } from '@/lib/utils';
import { ProjectUsageHistogram } from '@/types/types';

dayjs.extend(duration);

const Usage = () => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const { team } = useTeam();

  const interval = useMemo(
    () => ({
      startDate: dayjs().startOf('month').add(-selectedMonthIndex, 'months'),
      endDate: dayjs()
        .startOf('month')
        .add(-selectedMonthIndex + 1, 'months'),
    }),
    [selectedMonthIndex],
  );

  const { data: projectsUsage, error } = useSWR(
    team?.id
      ? `/api/team/${
          team.id
        }/token-histograms?startDate=${interval.startDate.format()}&endDate=${interval.endDate.format()}`
      : null,
    fetcher<ProjectUsageHistogram[]>,
  );

  const monthRange = useMemo(() => {
    const teamCreationDate = dayjs(team?.inserted_at);
    const numMonthsSinceTeamCreation = Math.max(
      1,
      Math.floor(dayjs.duration(dayjs().diff(teamCreationDate)).asMonths()),
    );
    const baseMonth = dayjs().startOf('month');
    return Array.from(Array(numMonthsSinceTeamCreation).keys()).map((n) => {
      return baseMonth.add(-n, 'months');
    });
  }, [team?.inserted_at]);

  const loading = !projectsUsage && !error;

  const barChartData: BarChartData[] = useMemo(() => {
    const dayCounts =
      projectsUsage?.reduce((acc, value) => {
        for (const entry of value.histogram) {
          const key = dayjs(entry.date).valueOf();
          const count = acc[key] || 0;
          acc[key] = count + entry.count;
        }
        return acc;
      }, {} as { [key: number]: number }) || {};

    const numDays = Math.max(
      1,
      Math.floor(
        dayjs.duration(interval.endDate.diff(interval.startDate)).asDays(),
      ),
    );

    return Array.from(Array(numDays).keys()).map((n) => {
      const date = interval.startDate.add(n, 'days');
      const timestamp = date.valueOf();
      const value = dayCounts[timestamp] || 0;
      return {
        start: timestamp,
        end: date.add(1, 'days').valueOf(),
        value,
      };
    });
  }, [projectsUsage, interval]);

  const monthlyUsedQueries = useMemo(() => {
    return barChartData.reduce((acc, key) => {
      return acc + key.value;
    }, 0);
  }, [barChartData]);

  const monthyQueryAllowance = (team && getMonthlyQueryAllowance(team)) || 0;

  const monthlyUsedQueriesPercentage =
    Math.min(
      100,
      Math.round((monthlyUsedQueries / monthyQueryAllowance) * 100),
    ) || 0;

  return (
    <TeamSettingsLayout
      title="Usage"
      titleComponent={<div className="flex items-center">Usage</div>}
      RightHeading={() => (
        <div className="flex w-full items-center gap-4">
          <div className="flex-grow" />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className={cn(
                  'flex select-none flex-row items-center gap-2 rounded border border-neutral-800 px-2 py-1 text-sm text-neutral-300 outline-none transition hover:bg-neutral-900',
                )}
                aria-label="Select team"
              >
                {monthRange[selectedMonthIndex].format('MMMM')}
                <ChevronsUpDown className="h-3 w-3" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="animate-menu-up dropdown-menu-content"
                sideOffset={5}
              >
                {monthRange.map((month, i) => {
                  const checked = selectedMonthIndex === i;
                  return (
                    <DropdownMenu.CheckboxItem
                      key={`project-dropdown-${month}`}
                      className="dropdown-menu-item dropdown-menu-item-indent"
                      checked={checked}
                      onClick={() => {
                        setSelectedMonthIndex(i);
                      }}
                    >
                      <>
                        {checked && (
                          <DropdownMenu.ItemIndicator className="dropdown-menu-item-indicator">
                            <Check className="h-3 w-3" />
                          </DropdownMenu.ItemIndicator>
                        )}
                        {month.format('MMMM')}
                      </>
                    </DropdownMenu.CheckboxItem>
                  );
                })}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}
      SubHeading={() => {
        return (
          <p className="mb-6 text-sm text-neutral-500">
            Below is a summary of your monthly usage of the query API. Dates are
            UTC-based, and data is updated in real time.
          </p>
        );
      }}
    >
      <BarChart
        data={barChartData}
        isLoading={!!loading}
        interval="30d"
        height={180}
        countLabel="queries"
      />
      <h2 className="mt-12 text-base font-bold">Monthly usage</h2>
      <div className="mt-1 flex h-10 w-1/2 flex-row items-center gap-4">
        <Progress.Root
          // Fix overflow clipping in Safari
          // https://gist.github.com/domske/b66047671c780a238b51c51ffde8d3a0
          style={{ transform: 'translateZ(0)' }}
          className="translate- relative h-2 flex-grow overflow-hidden rounded-full bg-neutral-800"
          value={monthlyUsedQueriesPercentage}
        >
          <Progress.Indicator
            className={cn('h-full w-full transform duration-500 ease-in-out', {
              'bg-sky-400': monthlyUsedQueriesPercentage <= 70,
              'bg-amber-400':
                monthlyUsedQueriesPercentage > 70 &&
                monthlyUsedQueriesPercentage <= 90,
              'bg-red-400': monthlyUsedQueriesPercentage > 90,
            })}
            style={{
              transform: `translateX(-${100 - monthlyUsedQueriesPercentage}%)`,
            }}
          />
        </Progress.Root>
        <span className="text-sm text-neutral-500">
          {monthlyUsedQueries} out of {monthyQueryAllowance} queries
        </span>
        {team?.slug && !team.is_enterprise_plan && (
          <Button
            href={`/settings/${team.slug}/plans`}
            variant="bordered"
            buttonSize="sm"
          >
            Upgrade
          </Button>
        )}
      </div>
    </TeamSettingsLayout>
  );
};

export default Usage;
