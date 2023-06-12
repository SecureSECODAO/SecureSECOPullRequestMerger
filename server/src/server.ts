import express from "express";
import { Octokit } from "@octokit/rest";
import { celebrate, Joi, errors, Segments } from "celebrate";
import { cryptr, octokit } from ".";
import rateLimit from "express-rate-limit";
import cors from "cors";

const app = express();

app.use(cors());

app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute
  message: "Too many requests from this IP, please try again later",
});

app.use(limiter);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "OK",
  });
});

app.get(
  "/latestCommit",
  celebrate({
    [Segments.QUERY]: Joi.object().keys({
      owner: Joi.string().required(),
      repo: Joi.string().required(),
      branch: Joi.string().required(),
    }),
  }),
  async (req, res) => {
    try {
      const { owner, repo, branch } = req.query;

      const response = await octokit.repos.getBranch({
        owner,
        repo,
        branch,
      });

      if (response.data == null || response.data.commit == null) {
        throw new Error("Could not get latest commit");
      }

      const encryptedSha = cryptr.encrypt(response.data.commit.sha);

      res.json({
        status: "ok",
        data: {
          sha: encryptedSha,
        },
      });
    } catch (error) {
      console.log("Could not get latest commit: \n", error);
      res.status(500).json({
        status: "error",
        message: "Could not get latest commit",
      });
    }
  }
);

app.use(errors());

const PORT = process.env.PORT || 5252;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
