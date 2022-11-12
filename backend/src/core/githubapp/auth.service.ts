import { Octokit } from 'octokit';
import githubConfig from '../../config/github.config';

(() => {
  // Initialize GitHub App with appIdentifier and appClientSecret
  // and generate JSON Web Token (JWT) which is used for appication level auth
  // More about JWT: https://jwt.io/
  const octokit = new Octokit({});
})();
