import fs = require("fs-extra");
import os = require("os");
import { HostParameterEntry, IHostAbstractions } from "../host/IHostAbstractions";
import { InputValidator } from "../host/InputValidator";
import { authenticateEnvironment, clearAuthentication } from "../pac/auth/authenticate";
import createPacRunner from "../pac/createPacRunner";
import getPacLogPath from "../pac/getPacLogPath";
import { RunnerParameters } from "../Parameters";
import { AuthCredentials } from "../pac/auth/authParameters";

export interface DataImportParameters {
  credentials: AuthCredentials;
  dataFile: HostParameterEntry;
  verbose: HostParameterEntry;
  environmentUrl: string;
}

export async function dataImport(parameters: DataImportParameters, runnerParameters: RunnerParameters, host: IHostAbstractions) {
  const platform = os.platform();
  if (platform !== 'win32') {
    throw new Error(`'data export' is only supported on Windows agents/runners (attempted run on ${platform})`);
  }
  const logger = runnerParameters.logger;
  const pac = createPacRunner(runnerParameters);
  const pacLogs = getPacLogPath(runnerParameters);

  const pacArgs = ["data", "import"];
  const validator = new InputValidator(host);

  try {
    const authenticateResult = await authenticateEnvironment(pac, parameters.credentials, parameters.environmentUrl, logger);
    logger.log("The Authentication Result: " + authenticateResult);

    validator.pushInput(pacArgs, "--data", parameters.dataFile);
    validator.pushInput(pacArgs, "--verbose", parameters.verbose);

    logger.log("Calling pac cli inputs: " + pacArgs.join(" "));
    const pacResult = await pac(...pacArgs);
    logger.log("Action Result: " + pacResult);

  } catch (error) {
    logger.error(`failed: ${error instanceof Error ? error.message : error}`);
    throw error;
  } finally {
    const clearAuthResult = await clearAuthentication(pac);
    logger.log("The Clear Authentication Result: " + clearAuthResult);
    if (fs.pathExistsSync(pacLogs)) {
      await host.getArtifactStore().upload('PacLogs', [pacLogs]);
    }
  }
}
