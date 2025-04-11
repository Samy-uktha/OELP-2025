export interface StepState {
	message: string;
	assignments: { [key: string]: number };
	studentPref: { [key: string]: number[] };
	projectState: { [key: string]: { assigned: string[]; capacity: number } };
  }
