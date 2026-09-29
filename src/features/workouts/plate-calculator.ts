export interface PlateBreakdown {
  plate: number;
  countPerSide: number;
}

export interface PlateCalculationResult {
  targetWeight: number;
  barWeight: number;
  weightPerSide: number;
  exactMatch: boolean;
  totalCalculated: number;
  platesPerSide: PlateBreakdown[];
}

export const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export function calculatePlates(
  targetWeight: number,
  barWeight: number = 20,
  availablePlates: number[] = DEFAULT_PLATES
): PlateCalculationResult {
  if (targetWeight <= barWeight) {
    return {
      targetWeight,
      barWeight,
      weightPerSide: 0,
      exactMatch: targetWeight === barWeight,
      totalCalculated: barWeight,
      platesPerSide: [],
    };
  }

  let remainingPerSide = (targetWeight - barWeight) / 2;
  const sortedPlates = [...availablePlates].sort((a, b) => b - a);
  const platesPerSide: PlateBreakdown[] = [];

  for (const plate of sortedPlates) {
    if (remainingPerSide >= plate) {
      const count = Math.floor(remainingPerSide / plate);
      platesPerSide.push({ plate, countPerSide: count });
      remainingPerSide = Number((remainingPerSide - count * plate).toFixed(2));
    }
  }

  const exactMatch = remainingPerSide === 0;
  const totalCalculated =
    barWeight +
    platesPerSide.reduce((acc, p) => acc + p.plate * p.countPerSide, 0) * 2;

  return {
    targetWeight,
    barWeight,
    weightPerSide: (totalCalculated - barWeight) / 2,
    exactMatch,
    totalCalculated,
    platesPerSide,
  };
}
