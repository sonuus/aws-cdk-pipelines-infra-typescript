import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as kms from '@aws-cdk/aws-kms'
import * as s3 from '@aws-cdk/aws-s3'
import { ACCOUNT_ID } from './configuration'

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
    get_resource_name_prefix
} from './configuration'
import { Bucket } from '@aws-cdk/aws-s3'

const target_environment = 'DEV'
const mappings = get_environment_configuration(target_environment)
console.log(`mappings=${JSON.stringify(mappings)}`)
const vpc_cidr = mappings[VPC_CIDR]
const logical_id_prefix = get_logical_id_prefix()
const resource_name_prefix = get_resource_name_prefix()
export interface ConstructorNameProps {}
const region='us-west-1'
export class S3BucketZonesStack extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: ConstructorNameProps) {
        super(scope, id)

        // CloudFormation stack to create AWS KMS Key, Amazon S3 resources such as buckets and bucket policies.

        // @param scope cdk.Construct: Parent of this stack, usually an App or a Stage, but could be any construct.:
        // @param construct_id str:
        //     The construct ID of this stack. If stackName is not explicitly defined,
        //     this id (and any parent IDs) will be used to determine the physical ID of the stack.
        // @param target_environment str: The target environment for stacks in the deploy stage
        // @param deployment_account_id: The id for the deployment account
        // @param kwargs:

        const s3Kmskey: kms.Key = this.createKMSKey(mappings.ACCOUNT_ID, logical_id_prefix, resource_name_prefix)

        const access_logs_bucket = this.create_access_logs_bucket(
            `${target_environment}${logical_id_prefix}AccessLogsBucket`,
            `${target_environment.toLowerCase()}-${resource_name_prefix}-${mappings.ACCOUNT_ID}-${region}-access-logs`,
            s3Kmskey
        )

        const raw_bucket = this.create_data_lake_zone_bucket(
            `${target_environment}${logical_id_prefix}RawBucket`,
            `${target_environment.toLowerCase()}-${resource_name_prefix}-${mappings.ACCOUNT_ID}-${region}-raw`,
            access_logs_bucket,
            s3Kmskey,
        )
        const conformed_bucket = this.create_data_lake_zone_bucket(
            `${target_environment}${logical_id_prefix}ConformedBucket`,
            `${target_environment.toLowerCase()}-${resource_name_prefix}-${mappings.ACCOUNT_ID}-${region}-conformed`,
            access_logs_bucket,
            s3Kmskey,
        )
        const purpose_built_bucket = this.create_data_lake_zone_bucket(
            `${target_environment}${logical_id_prefix}PurposeBuiltBucket`,
            `${target_environment.toLowerCase()}-${resource_name_prefix}-${mappings.ACCOUNT_ID}-${region}-purpose-built`,
            access_logs_bucket,
            s3Kmskey,
        )
        
        
        new cdk.CfnOutput(this, 
        `${target_environment}${logical_id_prefix}KmsKeyArn')`, {
        value: s3Kmskey.keyArn,
        exportName: mappings.S3_KMS_KEY })
        
        
        new cdk.CfnOutput(this, 
        `${target_environment}${logical_id_prefix}AccessLogsBucketName')`, {
        value: access_logs_bucket.bucketName,
        exportName: mappings.S3_ACCESS_LOG_BUCKET })
        
        
        new cdk.CfnOutput(this, 
        `${target_environment}${logical_id_prefix}RawBucketName')`, {
        value: raw_bucket.bucketName,
        exportName: mappings.S3_RAW_BUCKET })
        
        new cdk.CfnOutput(this, 
        `${target_environment}${logical_id_prefix}ConformedBucketName')`, {
        value: conformed_bucket.bucketName,
        exportName: mappings.S3_CONFORMED_BUCKET })
        
        new cdk.CfnOutput(this, 
        `${target_environment}${logical_id_prefix}PurposeBuiltBucketName')`, {
        value: purpose_built_bucket.bucketName,
        exportName: mappings.S3_PURPOSE_BUILT_BUCKET })
        
        
        
    }

    private createKMSKey(deployment_account_id: string, logical_id_prefix: string, resource_name_prefix: string): kms.Key {
        const s3_kms_key = new kms.Key(this, `${target_environment}${logical_id_prefix}KmsKey`, {
            admins: [new iam.AccountPrincipal(mappings.ACCOUNT_ID)],
            description: 'Key used for encrypting Data Lake S3 Buckets',
            alias: `${target_environment.toLowerCase()}-${resource_name_prefix}-kms-key`,
        })

        s3_kms_key.addToResourcePolicy(
            new iam.PolicyStatement({
                principals: [new iam.AccountPrincipal(mappings.ACCOUNT_ID)],
                actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
                resources: ['*'],
                effect: iam.Effect.ALLOW,
            }),
        )

        return s3_kms_key
    }

    private create_data_lake_zone_bucket(logical_id_prefix: string, bucket_name: string, access_logs_bucket: s3.Bucket, s3_kms_key: kms.Key): s3.Bucket{

        return new Bucket(this, logical_id_prefix, {
            accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            bucketKeyEnabled: true,
            bucketName: bucket_name,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: s3_kms_key,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            publicReadAccess: false,
            versioned: true,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
            lifecycleRules: [
                {
                    enabled: true,
                    expiration: cdk.Duration.days(60),
                    noncurrentVersionExpiration: cdk.Duration.days(30)
                }
            ]
        })
    }

    private create_access_logs_bucket(logical_id_prefix: string, bucket_name:string, s3_kms_key:kms.Key): s3.Bucket {


        const bucket = new Bucket(this, logical_id_prefix, {
            accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            bucketKeyEnabled: true,
            bucketName: bucket_name,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: s3_kms_key,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            publicReadAccess: false,
            versioned: true,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED
        })

        const policy_document_statements = [
            new iam.PolicyStatement({
                sid:'OnlyAllowSecureTransport',
                effect:iam.Effect.DENY,
                principals:[new iam.AnyPrincipal()],
                actions:[
                    's3:GetObject',
                    's3:PutObject',
                ],
                resources:[`${bucket.bucketArn}/*`],
                conditions:{'Bool': {'aws:SecureTransport': 'false'}}
            })
        ]

        bucket.addToResourcePolicy(policy_document_statements[0])
        return bucket
    }
}
