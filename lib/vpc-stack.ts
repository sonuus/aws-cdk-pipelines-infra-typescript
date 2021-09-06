import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2'
import {
    AVAILABILITY_ZONE_1,
    AVAILABILITY_ZONE_2,
    AVAILABILITY_ZONE_3,
    ROUTE_TABLE_1,
    ROUTE_TABLE_2,
    ROUTE_TABLE_3,
    SHARED_SECURITY_GROUP_ID,
    SUBNET_ID_1,
    SUBNET_ID_2,
    SUBNET_ID_3,
    VPC_CIDR,
    VPC_ID,
    get_environment_configuration,
    get_logical_id_prefix,
} from './configuration'

const target_environment = 'DEV'
export interface VPCProps {

}

export class VpcStack extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props?: VPCProps) {
    super(scope, id);

    const mappings = get_environment_configuration(target_environment)
    const vpc_cidr = mappings[VPC_CIDR]
    const logical_id_prefix = get_logical_id_prefix()

    const vpc = new ec2.Vpc(this, `${logical_id_prefix}vpc`, { cidr: vpc_cidr })
    const shared_security_group_ingress = new ec2.SecurityGroup(
        this,
        `${target_environment}${logical_id_prefix}SharedIngressSecurityGroup`,
        {
            vpc: vpc,
            description: 'Shared Security Group for Data Lake resources with self-referencing ingress rule.',
            securityGroupName: `${target_environment}${logical_id_prefix}SharedIngressSecurityGroup`,
        },
    )

    shared_security_group_ingress.addIngressRule(
        shared_security_group_ingress,
        ec2.Port.allTraffic(),
        `Self-referencing ingress rule`,
    )

    vpc.addGatewayEndpoint(`${target_environment}${logical_id_prefix}S3Endpoint`, {
        service: ec2.GatewayVpcEndpointAwsService.S3,
    })

    vpc.addGatewayEndpoint(`${target_environment}${logical_id_prefix}DynamoEndpoint`, {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    })

    vpc.addInterfaceEndpoint(`${target_environment}${logical_id_prefix}GlueEndpoint`, {
        service: ec2.InterfaceVpcEndpointAwsService.GLUE,
        securityGroups: [shared_security_group_ingress],
    })

    vpc.addInterfaceEndpoint(`${target_environment}${logical_id_prefix}KmsEndpoint`, {
        service: ec2.InterfaceVpcEndpointAwsService.KMS,
        securityGroups: [shared_security_group_ingress],
    })

    vpc.addInterfaceEndpoint(`${target_environment}${logical_id_prefix}SsmEndpoint`, {
        service: ec2.InterfaceVpcEndpointAwsService.SSM,
        securityGroups: [shared_security_group_ingress],
    })
    vpc.addInterfaceEndpoint(`${target_environment}${logical_id_prefix}SecretsManagerEndpoint`, {
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        securityGroups: [shared_security_group_ingress],
    })
    vpc.addInterfaceEndpoint(`${target_environment}${logical_id_prefix}StepFunctionsEndpoint`, {
        service: ec2.InterfaceVpcEndpointAwsService.STEP_FUNCTIONS,
        securityGroups: [shared_security_group_ingress],
    })

    new cdk.CfnOutput(this, `${target_environment}${logical_id_prefix}VpcPrivateSubnet1')`, {
        value: vpc.privateSubnets[0].subnetId,
        exportName: mappings[SUBNET_ID_1],
    })

    
  }
}