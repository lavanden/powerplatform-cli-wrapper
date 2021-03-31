import LoggerParameters from "../LoggerParameters";

export default interface RunnerParameters extends LoggerParameters {
  getWorkingDir: () => string;
  getRunnersDir: () => string;
}
