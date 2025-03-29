let profileData = null;

async function fetchProfile() {
    const username = document.getElementById("username").value;
    if (!username) {
        alert("Please enter a GitHub username.");
        return;
    }

    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) throw new Error("User not found.");
        profileData = await response.json();

        document.getElementById("avatar").src = profileData.avatar_url;
        document.getElementById("name").innerText = profileData.name || "N/A";
        document.getElementById("login").innerText = profileData.login;
        document.getElementById("bio").innerText = profileData.bio || "N/A";
        document.getElementById("location").innerText = profileData.location || "N/A";
        document.getElementById("followers").innerText = profileData.followers;
        document.getElementById("following").innerText = profileData.following;
        document.getElementById("public_repos").innerText = profileData.public_repos;
        document.getElementById("profile_link").href = profileData.html_url;

        document.getElementById("profile-container").style.display = "block";
        document.getElementById("repo-container").style.display = "block";
        document.getElementById("ai-section").style.display = "block";

        fetchRepositories(username);
    } catch (error) {
        alert("Error fetching GitHub profile: " + error.message);
    }
}

async function fetchRepositories(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        if (!response.ok) throw new Error("Error fetching repositories.");
        const repos = await response.json();

        const repoContainer = document.getElementById("repo-container");
        repoContainer.innerHTML = "";
        repos.forEach(repo => {
            const repoDiv = document.createElement("div");
            repoDiv.classList.add("repo");
            repoDiv.innerHTML = `
                <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                <p>${repo.description || "No description available."}</p>
            `;
            repoContainer.appendChild(repoDiv);
        });
    } catch (error) {
        console.error("Error fetching repositories:", error);
    }
}

async function askAI() {
    if (!profileData) {
        alert("Please fetch a GitHub profile first.");
        return;
    }

    const query = document.getElementById("ai-query").value.trim();
    if (!query) {
        alert("Please enter a question.");
        return;
    }

    document.getElementById("ai-response").style.display = "block";
    document.getElementById("ai-response").innerHTML = `<p><strong>AI is thinking...</strong></p>`;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer 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",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are an AI assistant that provides structured, well-formatted insights on GitHub profiles. Your response must be formatted using HTML, with headings (<h2>, <h3>), bullet points (<ul><li>), and proper line breaks (<br><br>) for readability." },
                    { role: "user", content: `Analyze the following GitHub profile data and respond in a structured, readable format:\n\n${JSON.stringify(profileData, null, 2)}\n\nQuestion: ${query}` },
                ],
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${data.error?.message || "Unknown error"}`);
        }

        let aiResponse = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

        aiResponse = aiResponse
            .replace(/^Overview of GitHub Profile/g, "<h2>🔍 Overview of GitHub Profile</h2>")
            .replace(/^Profile Statistics/g, "<h3>📊 Profile Statistics</h3>")
            .replace(/^Contact and Background Information/g, "<h3>📞 Contact & Background Information</h3>")
            .replace(/^Profile Creation and Update/g, "<h3>🕒 Profile Creation & Updates</h3>")
            .replace(/^Conclusion/g, "<h3>📌 Conclusion</h3>")
            .replace(/(?<=\n)(Login|Name|Type|Site Admin):/g, "<strong>$1:</strong>")
            .replace(/(?<=\n)(Public Repositories|Public Gists|Followers|Following):/g, "<strong>$1:</strong>")
            .replace(/(?<=\n)(Company|Location|Email|Hireable|Bio|Twitter Username):/g, "<strong>$1:</strong>")
            .replace(/(?<=\n)(Created At|Updated At):/g, "<strong>$1:</strong>")
            .replace(/\n+/g, "<br>");

        document.getElementById("ai-response").innerHTML = aiResponse;

    } catch (error) {
        document.getElementById("ai-response").innerHTML = `<p><strong>Error:</strong> Unable to fetch AI response.</p>`;
        console.error("AI Error:", error);
    }
}
