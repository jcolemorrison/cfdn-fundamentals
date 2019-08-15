const fs = require('fs')

const awscliConf = fs.readFileSync(`${__dirname}/files/awscli.conf`, 'utf-8')
const awslogsConf = fs.readFileSync(`${__dirname}/files/awslogs.conf`, 'utf-8')
const userdata = fs.readFileSync(`${__dirname}/files/userdata.sh`, 'utf-8')

module.exports = {
  "Instance": {
    "Type": "AWS::EC2::Instance",
    "Metadata": {
      "AWS::CloudFormation::Init": {
        "configSets": {
          "default": [
            "init",
            "install",
            "setupLogs",
            "setupApp"
          ]
        },
        "init": {
          "commands": {
            "aYumUpdate": {
              "command": "yum update -y",
              "cwd": "~"
            },
            "bGrabNode": {
              "command": "curl -sL https://rpm.nodesource.com/setup_10.x | bash -",
              "cwd": "~"
            },
            "cMakeAppDir": {
              "command": "mkdir -p /home/ec2-user/app",
              "cwd": "~"
            }
          }
        },
        "install": {
          "packages": {
            "yum": {
              "git": [],
              "nodejs": [],
              "awslogs": []
            }
          }
        },
        "setupLogs": {
          "files": {
            "/etc/awslogs/awscli.conf": {
              "content": {
                "Fn::Sub": awscliConf
              },
              "owner": "root",
              "group": "root",
              "mode": "000644"
            },
            "/etc/awslogs/awslogs.conf": {
              "content": {
                "Fn::Sub": awslogsConf
              },
              "owner": "root",
              "group": "root",
              "mode": "000644"
            },
            "/var/log/nodejs.log": {
              "content": "[Nodejs Logs]\n",
              "owner": "ec2-user",
              "group": "ec2-user",
              "mode": "000644"
            },
            "/var/log/nodejserr.log": {
              "content": "[Nodejs Error Logs]\n",
              "owner": "ec2-user",
              "group": "ec2-user",
              "mode": "000644"
            }
          },
          "services": {
            "sysvinit": {
              "awslogsd": {
                "enabled": true,
                "ensureRunning": true,
                "files": [
                  "/etc/awslogs/awscli.conf",
                  "/etc/awslogs/awslogs.conf"
                ]
              }
            }
          }
        },
        "setupApp": {
          "commands": {
            "aCloneRepo": {
              "command": "git clone https://github.com/jcolemorrison/ec2-lb-api.git .",
              "cwd": "/home/ec2-user/app"
            },
            "bInstallNpmPackages": {
              "command": "npm install",
              "cwd": "/home/ec2-user/app"
            },
            "cFirewall": {
              "command": "iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3000",
              "cwd": "/home/ec2-user/app"
            },
            "dStartServer": {
              "command": "su ec2-user -c \"node . > /var/log/nodejs.log 2> /var/log/nodejserr.log\"",
              "cwd": "/home/ec2-user/app"
            }
          }
        }
      }
    },
    "Properties": {
      "ImageId": {
        "Ref": "ParamAmiId"
      },
      "InstanceType": {
        "Ref": "ParamInstanceType"
      },
      "Tags": [
        {
          "Key": "Name",
          "Value": {
            "Fn::Sub": "${AWS::StackName}-instance"
          }
        },
        {
          "Key": "Owner",
          "Value": {
            "Ref": "ParamAuthorName"
          }
        }
      ],
      "SecurityGroupIds": [
        {
          "Fn::ImportValue": {
            "Fn::Sub": "${ParamSecurityStackName}-SecurityGroupId"
          }
        }
      ],
      "KeyName": {
        "Ref": "ParamEC2KeyPair"
      },
      "UserData": {
        "Fn::Base64": {
          "Fn::Sub": userdata
        }
      },
      "IamInstanceProfile": {
        "Ref": "InstanceProfile"
      }
    }
  }
}