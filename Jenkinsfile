// Jenkins Pipeline for TechShop Microservices
// Implements DevOps requirement: Gitlab CI/CD (Jenkins)

pipeline {
    agent any
    
    environment {
        MAVEN_HOME = tool 'Maven-3.9'
        JAVA_HOME = tool 'JDK-21'
        NODE_HOME = tool 'NodeJS-20'
        DOCKER_REGISTRY = 'your-registry.com'
        DOCKER_CREDENTIALS = credentials('docker-registry-credentials')
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }
        
        stage('Build Common Lib') {
            steps {
                echo 'Building common-lib...'
                dir('techshop-microservice/common-lib') {
                    sh '${MAVEN_HOME}/bin/mvn clean install -DskipTests'
                }
            }
        }
        
        stage('Build Services') {
            parallel {
                stage('Discovery Service') {
                    steps {
                        dir('techshop-microservice/discovery-service') {
                            sh '${MAVEN_HOME}/bin/mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Gateway Service') {
                    steps {
                        dir('techshop-microservice/gateway-service') {
                            sh '${MAVEN_HOME}/bin/mvn clean package -DskipTests'
                        }
                    }
                }
                stage('User Service') {
                    steps {
                        dir('techshop-microservice/user-service') {
                            sh '${MAVEN_HOME}/bin/mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Product Service') {
                    steps {
                        dir('techshop-microservice/product-service') {
                            sh '${MAVEN_HOME}/bin/mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Order Service') {
                    steps {
                        dir('techshop-microservice/order-service') {
                            sh '${MAVEN_HOME}/bin/mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Cart Service') {
                    steps {
                        dir('techshop-microservice/cart-service') {
                            sh '${MAVEN_HOME}/bin/mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Payment Service') {
                    steps {
                        dir('techshop-microservice/payment-service') {
                            sh '${MAVEN_HOME}/bin/mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Notification Service') {
                    steps {
                        dir('techshop-microservice/notification-service') {
                            sh '${MAVEN_HOME}/bin/mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Inventory Service') {
                    steps {
                        dir('techshop-microservice/inventory-service') {
                            sh '${MAVEN_HOME}/bin/mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Review Service') {
                    steps {
                        dir('techshop-microservice/review-service') {
                            sh '${MAVEN_HOME}/bin/mvn clean package -DskipTests'
                        }
                    }
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                echo 'Building frontend...'
                dir('techshop-frontend') {
                    sh '${NODE_HOME}/bin/npm ci'
                    sh '${NODE_HOME}/bin/npm run build'
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        echo 'Running backend tests...'
                        dir('techshop-microservice') {
                            sh '${MAVEN_HOME}/bin/mvn test'
                        }
                    }
                    post {
                        always {
                            junit '**/target/surefire-reports/*.xml'
                            jacoco execPattern: '**/target/jacoco.exec'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        echo 'Running frontend tests...'
                        dir('techshop-frontend') {
                            sh '${NODE_HOME}/bin/npm run test -- --run'
                        }
                    }
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                echo 'Building Docker images...'
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        sh 'docker-compose build'
                        
                        if (env.BRANCH_NAME == 'main') {
                            echo 'Pushing images to registry...'
                            sh 'docker-compose push'
                        }
                    }
                }
            }
        }
        
        stage('Deploy to Development') {
            when {
                branch 'develop'
            }
            steps {
                echo 'Deploying to development environment...'
                sshagent(['dev-server-ssh']) {
                    sh '''
                        ssh user@dev-server << 'EOF'
                            cd /opt/techshop
                            docker-compose pull
                            docker-compose down
                            docker-compose up -d
                            docker-compose ps
                        EOF
                    '''
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                echo 'Deploying to production environment...'
                sshagent(['prod-server-ssh']) {
                    sh '''
                        ssh user@prod-server << 'EOF'
                            cd /opt/techshop
                            docker-compose pull
                            docker-compose down
                            docker-compose up -d
                            docker-compose ps
                        EOF
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
            // Send notification (email, Slack, etc.)
        }
        failure {
            echo 'Pipeline failed!'
            // Send notification (email, Slack, etc.)
        }
    }
}
