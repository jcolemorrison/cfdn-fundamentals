#!/usr/bin/env bash

# Trigger the CFN Init Script

/opt/aws/bin/cfn-init -v --stack ${AWS::StackName} \
        --resource Instance \
        --configsets default \
        --region ${AWS::Region}
