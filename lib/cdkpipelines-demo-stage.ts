import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { CdkStack } from './cdk-stack';

/**
 * Deployable unit of web service app
 */
export class CdkpipelinesDemoStage extends Stage {
  public readonly urlOutput: CfnOutput;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const infra = new CdkStack(this, 'InfraStack');

    // Expose CdkStack's output one level higher
    // this.urlOutput = service.urlOutput;
  }
}