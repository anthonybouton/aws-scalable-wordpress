#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { ScalableWordPressStack } from '../lib/scalable-wordpress-stack';


const app = new App();
new ScalableWordPressStack(app, 'ScalableWordPressStack', {
  stackName: 'scalable-wordpress-stack'
});
