import * as cdk from '@aws-cdk/core'
import { VpcStack } from './vpc-stack'
import { S3BucketZonesStack } from './bucket-stack'
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

export class CdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)
        const mappings = get_environment_configuration(target_environment)
        const vpc_cidr = mappings[VPC_CIDR]
        const logical_id_prefix = get_logical_id_prefix()

        // const vpc = new VpcStack(this, `${target_environment}${logical_id_prefix}InfrastructureVpc`, {})

        // const buckets_access_logs = new S3BucketZonesStack(this, `${target_environment}${logical_id_prefix}BucketZones`, {})
    }
}
