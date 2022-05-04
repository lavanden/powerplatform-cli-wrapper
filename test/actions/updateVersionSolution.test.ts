/* eslint-disable @typescript-eslint/no-explicit-any */
import rewiremock from "../rewiremock";
import * as sinonChai from "sinon-chai";
import * as chaiAsPromised from "chai-as-promised";
import { should, use } from "chai";
import { restore, stub } from "sinon";
import { ClientCredentials, RunnerParameters } from "../../src";
import { createDefaultMockRunnerParameters, createMockClientCredentials, mockEnvironmentUrl } from "./mock/mockData";
import { UpdateVersionSolutionParameters } from "../../src/actions/updateVersionSolution";
import Sinon = require("sinon");
import { mockHost } from "./mock/mockHost";
should();
use(sinonChai);
use(chaiAsPromised);

describe("action: updateVersion solution", () => {
  let pacStub: Sinon.SinonStub<any[],any>;
  let authenticateEnvironmentStub: Sinon.SinonStub<any[],any>;
  let clearAuthenticationStub: Sinon.SinonStub<any[], any>;
  const host = new mockHost();
  const mockClientCredentials: ClientCredentials = createMockClientCredentials();
  const envUrl: string = mockEnvironmentUrl;
  let updateVersionSolutionParameters: UpdateVersionSolutionParameters;

  beforeEach(() => {
    pacStub = stub();
    authenticateEnvironmentStub = stub();
    clearAuthenticationStub = stub();
    updateVersionSolutionParameters = createUpdateVersionSolutionParameters();
  })
  afterEach(() => restore())

  async function runActionWithMocks(updateVersionSolutionParameters: UpdateVersionSolutionParameters) {
    const runnerParameters: RunnerParameters = createDefaultMockRunnerParameters();
    const mockedActionModule = await rewiremock.around(() => import("../../src/actions/updateVersionSolution"),
      (mock) => {
        mock(() => import("../../src/pac/createPacRunner")).withDefault(() => pacStub);
        mock(() => import("../../src/pac/auth/authenticate")).with(
          {
            authenticateEnvironment: authenticateEnvironmentStub,
            clearAuthentication: clearAuthenticationStub
          });
      });

    authenticateEnvironmentStub.returns("Authentication successfully created.");
    clearAuthenticationStub.returns("Authentication profiles and token cache removed");
    pacStub.returns("");
    await mockedActionModule.updateVersionSolution(updateVersionSolutionParameters, runnerParameters, host);
  }

  const createUpdateVersionSolutionParameters = (): UpdateVersionSolutionParameters => ({
    credentials: mockClientCredentials,
    environmentUrl: envUrl,
    buildVersion: { name: 'BuildVersion', required: true },
    strategy: { name: 'Strategy', required: false },
    fileName: { name: 'FileName', required: false },
  });

  it("with required params, calls pac runner with correct args", async () => {
    await runActionWithMocks(updateVersionSolutionParameters);

    authenticateEnvironmentStub.should.have.been.calledOnceWith(pacStub, mockClientCredentials, envUrl);
    pacStub.should.have.been.calledOnceWith("solution", "version", "--buildversion", host.buildVersion);
    clearAuthenticationStub.should.have.been.calledOnceWith(pacStub);
  });
});