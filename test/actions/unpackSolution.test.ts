import { should, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { restore, stub } from "sinon";
import * as sinonChai from "sinon-chai";
import { ClientCredentials, RunnerParameters } from "../../src";
import { UnpackSolutionParameters } from "../../src/actions";
import { CommandRunner } from "../../src/CommandRunner";
import rewiremock from "../rewiremock";
import { createDefaultMockRunnerParameters, createMockClientCredentials, mockEnvironmentUrl } from "./mock/mockData";
import Sinon = require("sinon");
import { IHostAbstractions } from "../../src/host/IHostAbstractions";
import { platform } from "os";
should();
use(sinonChai);
use(chaiAsPromised);

describe("action: unpack solution", () => {
  let pacStub: CommandRunner;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authenticateEnvironmentStub: Sinon.SinonStub<any[], any>;
  const mockClientCredentials: ClientCredentials = createMockClientCredentials();
  const environmentUrl: string = mockEnvironmentUrl;
  const zip = "./ContosoSolution.zip";
  const mockHost : IHostAbstractions = {
    name: "host",
    getInput: () => zip,
  }
  const folder = "./folder";
  const absoluteSolutionPath = (platform() === "win32") ? 'D:\\Test\\working\\ContosoSolution.zip' : '/Test/working/ContosoSolution.zip';
  const absoluteFolderPath = (platform() === "win32") ? 'D:\\Test\\working\\folder' : '/Test/working/folder';

  beforeEach(() => {
    pacStub = stub();
    authenticateEnvironmentStub = stub();
  });
  afterEach(() => restore());

  async function runActionWithMocks(unpackSolutionParameters: UnpackSolutionParameters): Promise<void> {
    const runnerParameters: RunnerParameters = createDefaultMockRunnerParameters();

    const mockedActionModule = await rewiremock.around(() => import("../../src/actions/unpackSolution"),
      (mock) => {
        mock(() => import("../../src/pac/createPacRunner")).withDefault(() => pacStub);
        mock(() => import("../../src/pac/auth/authenticate")).with({ authenticateEnvironment: authenticateEnvironmentStub });
      });
    const stubFnc = Sinon.stub(mockHost, "getInput");
    stubFnc.onCall(0).returns(zip);
    stubFnc.onCall(1).returns(folder);
    await mockedActionModule.unpackSolution(unpackSolutionParameters, runnerParameters, mockHost);
  }

  it("calls pac runner with correct arguments", async () => {
    const unpackSolutionParameters: UnpackSolutionParameters = {
      credentials: mockClientCredentials,
      environmentUrl: environmentUrl,
      solutionZipFile: { name: 'SolutionInputFile', required: true },
      sourceFolder: { name: 'SolutionTargetFolder', required: true },
      solutionType: { name: 'SolutionType', required: false, defaultValue: "Unmanaged" },
    };

    await runActionWithMocks(unpackSolutionParameters);

    authenticateEnvironmentStub.should.have.been.calledOnceWith(pacStub, mockClientCredentials, environmentUrl);
    pacStub.should.have.been.calledOnceWith("solution", "unpack", "--zipFile", absoluteSolutionPath, "--folder", absoluteFolderPath,
    "--packageType", "Unmanaged");
  });
});