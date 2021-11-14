# Scalable WordPress Instance on AWS

I recently got AWS Certified and I wanted to put the knowledge I gained into practise.
I always had a slight desire to start a blog, and this could be a great way to start it.

The diagram below shows what the final result will look like

![Final Architeture Diagram](/assets/architecture_diagram.png)

Please remind that this CDK project is using the **aws-cdk@next version**. I am willing to provide this stack with a beta version ( as of today ), since I don't have to manually reference the individual packages anymore as opposed to version 1.x.

Prerequisites
1. Install the aws-cdk@next npm package  `npm i aws-cdk@next` 
2. Have an active AWS account
3. Have the AWS CLI installed and configured a default ( or named ) profile
4. Be willing to spend some money provisioning this infrastructure, since this is stack with multi-az resources, running this will provide you with high availability but at a cost
5. Have the AWS CDK installed
6. Bootstrap the environment you wish to deploy on with  `cdk bootstrap --region {YOUR_REGION} --profile {YOUR_PROFILE_NAME}`

